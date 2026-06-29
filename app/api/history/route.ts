import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERATED_IMAGES_BUCKET = "generated-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const HISTORY_SELECT_COLUMNS =
  "id, image_type, subject, compiled_prompt, storage_path, created_at, completed_at";

type HistoryJob = {
  id: string;
  image_type: string;
  subject: string;
  compiled_prompt: string;
  storage_path: string | null;
  created_at: string;
  completed_at: string | null;
};

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

async function createSignedImageUrl(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  storagePath: string | null
) {
  if (!storagePath) {
    return null;
  }

  try {
    const { data, error } = await admin.storage
      .from(GENERATED_IMAGES_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (error) {
      return null;
    }

    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "Please sign in to view history.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("generation_jobs")
    .select(HISTORY_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(500, "HISTORY_FAILED", "Could not load history.");
  }

  const jobs = (data ?? []) as HistoryJob[];
  const items = await Promise.all(
    jobs.map(async (job) => ({
      ...job,
      imageUrl: await createSignedImageUrl(admin, job.storage_path)
    }))
  );

  return NextResponse.json({ items });
}
