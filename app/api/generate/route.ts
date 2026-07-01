import { NextResponse } from "next/server";
import { generateImageBytes } from "@/lib/generation/providers";
import { compilePrompt } from "@/lib/generation/prompt";
import { generationRequestSchema } from "@/lib/generation/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createE2eImageDataUrl, isE2eTestMode } from "@/lib/testing/e2e";

const GENERATED_IMAGES_BUCKET = "generated-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const STALE_PROCESSING_JOB_AGE_MS = 15 * 60 * 1000;

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function readErrorString(error: unknown, field: "message" | "code" | "type" | "name") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return null;
  }

  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

function getErrorMessage(error: unknown) {
  return (
    (error instanceof Error ? error.message : null) ??
    readErrorString(error, "message") ??
    "Image generation failed."
  );
}

function getGenerationFailure(error: unknown) {
  const message = getErrorMessage(error);
  const code = readErrorString(error, "code");
  const type = readErrorString(error, "type");
  const name = readErrorString(error, "name");

  if (
    code === "billing_hard_limit_reached" ||
    type === "billing_limit_user_error"
  ) {
    return {
      status: 503,
      code: "OPENAI_BILLING_LIMIT",
      error: "OpenAI billing hard limit has been reached."
    };
  }

  if (code === "IMAGE_PROVIDER_CONFIGURATION") {
    return {
      status: 503,
      code: "IMAGE_PROVIDER_CONFIGURATION",
      error: "Image provider credentials are not configured."
    };
  }

  if (
    name === "APIConnectionTimeoutError" ||
    /timed?\s*out/i.test(message) ||
    /timeout/i.test(message)
  ) {
    return {
      status: 504,
      code: "OPENAI_TIMEOUT",
      error: "OpenAI image generation timed out. Check network or proxy settings."
    };
  }

  return {
    status: 500,
    code: "GENERATION_FAILED",
    error: "Generation failed and credits were not charged."
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "Please sign in to generate an image.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, "VALIDATION_ERROR", "Invalid JSON request body.");
  }

  const parsed = generationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid generation request.");
  }

  const compiledPrompt = compilePrompt(parsed.data);

  if (isE2eTestMode()) {
    return NextResponse.json({
      id: "e2e-generation-id",
      imageUrl: createE2eImageDataUrl(),
      compiledPrompt
    });
  }

  const admin = createSupabaseAdminClient();
  const cleanupCompletedAt = new Date();
  const staleProcessingCutoff = new Date(
    cleanupCompletedAt.getTime() - STALE_PROCESSING_JOB_AGE_MS
  ).toISOString();
  const { error: staleCleanupError } = await admin
    .from("generation_jobs")
    .update({
      status: "failed",
      error_message: "Generation expired before completion.",
      completed_at: cleanupCompletedAt.toISOString()
    })
    .eq("user_id", user.id)
    .eq("status", "processing")
    .lt("created_at", staleProcessingCutoff);

  if (staleCleanupError) {
    return jsonError(
      500,
      "STALE_GENERATION_CLEANUP_FAILED",
      "We could not recover previous unfinished generations."
    );
  }

  const { data: processingJob, error: processingJobError } = await admin
    .from("generation_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "processing")
    .maybeSingle();

  if (processingJobError) {
    return jsonError(
      500,
      "GENERATION_IN_PROGRESS_CHECK_FAILED",
      "We could not check your current generation status."
    );
  }

  if (processingJob) {
    return jsonError(
      409,
      "GENERATION_IN_PROGRESS",
      "You already have an image generation in progress."
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return jsonError(404, "PROFILE_NOT_FOUND", "Profile not found.");
  }

  if (profile.credits_balance < 1) {
    return jsonError(
      402,
      "INSUFFICIENT_CREDITS",
      "You have used your free credits."
    );
  }

  const { data: job, error: jobError } = await admin
    .from("generation_jobs")
    .insert({
      user_id: user.id,
      status: "processing",
      image_type: parsed.data.imageType,
      aspect_ratio: parsed.data.aspectRatio,
      style: parsed.data.style,
      scene: parsed.data.scene,
      whitespace: parsed.data.whitespace,
      subject: parsed.data.subject,
      extra_requirements: parsed.data.extraRequirements,
      compiled_prompt: compiledPrompt
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return jsonError(
      500,
      "JOB_CREATE_FAILED",
      "We could not create an image generation job."
    );
  }

  const storagePath = `${user.id}/${job.id}.png`;

  try {
    const imageBytes = await generateImageBytes({
      prompt: compiledPrompt,
      aspectRatio: parsed.data.aspectRatio
    });
    const { error: uploadError } = await admin.storage
      .from(GENERATED_IMAGES_BUCKET)
      .upload(storagePath, imageBytes, {
        contentType: "image/png",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: completeError } = await admin.rpc(
      "complete_generation_and_charge",
      {
        p_user_id: user.id,
        p_generation_id: job.id,
        p_storage_path: storagePath
      }
    );

    if (completeError) {
      throw completeError;
    }
  } catch (error) {
    const failure = getGenerationFailure(error);

    await admin.rpc("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: job.id,
      p_error_message: getErrorMessage(error)
    });

    return jsonError(failure.status, failure.code, failure.error);
  }

  let imageUrl: string | null = null;

  try {
    const { data: signedUrlData } = await admin.storage
      .from(GENERATED_IMAGES_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
    imageUrl = signedUrlData?.signedUrl ?? null;
  } catch {
    imageUrl = null;
  }

  return NextResponse.json({
    id: job.id,
    imageUrl,
    compiledPrompt
  });
}
