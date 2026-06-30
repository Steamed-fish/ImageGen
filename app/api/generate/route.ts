import { NextResponse } from "next/server";
import { generateImageBytes } from "@/lib/generation/openai";
import { compilePrompt } from "@/lib/generation/prompt";
import { generationRequestSchema } from "@/lib/generation/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERATED_IMAGES_BUCKET = "generated-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const STALE_PROCESSING_JOB_AGE_MS = 15 * 60 * 1000;

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Image generation failed.";
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

  const compiledPrompt = compilePrompt(parsed.data);
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
    await admin.rpc("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: job.id,
      p_error_message: getErrorMessage(error)
    });

    return jsonError(
      500,
      "GENERATION_FAILED",
      "Generation failed and credits were not charged."
    );
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
