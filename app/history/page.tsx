import { redirect } from "next/navigation";
import { HistoryGrid, type HistoryItem } from "@/components/history-grid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERATED_IMAGES_BUCKET = "generated-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const HISTORY_SELECT_COLUMNS =
  "id, image_type, subject, compiled_prompt, storage_path, created_at, completed_at";

type HistoryJob = Omit<HistoryItem, "imageUrl">;

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

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/generate");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("generation_jobs")
    .select(HISTORY_SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const jobs = error ? [] : ((data ?? []) as HistoryJob[]);
  const items = await Promise.all(
    jobs.map(async (job) => ({
      ...job,
      imageUrl: await createSignedImageUrl(admin, job.storage_path)
    }))
  );

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Generation history</h1>
        <div className="mt-6">
          <HistoryGrid items={items} />
        </div>
      </div>
    </main>
  );
}
