import { redirect } from "next/navigation";
import { HistoryGrid, type HistoryItem } from "@/components/history-grid";
import { getDictionary } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
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
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
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
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-2xl border border-line bg-white/80 p-6 shadow-soft backdrop-blur">
          <p className="text-sm font-semibold text-moss">
            {locale === "zh" ? "你的生成资产" : "Your creative assets"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {dictionary.history.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {locale === "zh"
              ? "成功生成的图片会自动保存到这里，方便复用 prompt 和打开原图。"
              : "Completed images are saved here, ready for prompt reuse and asset review."}
          </p>
        </section>
        <div>
          <HistoryGrid
            items={items}
            locale={locale}
            labels={dictionary.history}
          />
        </div>
      </div>
    </main>
  );
}
