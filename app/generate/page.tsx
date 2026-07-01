import { redirect } from "next/navigation";
import { GeneratorForm } from "@/components/generator-form";
import { buildLoginPath } from "@/lib/auth/redirects";
import { getDictionary } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GeneratePage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginPath("/generate"));
  }

  return (
    <main className="min-h-screen px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-2xl border border-line bg-white/80 p-5 shadow-soft backdrop-blur sm:p-6">
          <p className="text-sm font-semibold text-moss">
            {locale === "zh" ? "AI 创作工作台" : "AI creation workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            {dictionary.generator.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            {locale === "zh"
              ? "把图片类型、比例、风格、场景和留白变成一条可执行的专业英文 prompt。"
              : "Turn type, ratio, style, scene, and whitespace into a production-ready English prompt."}
          </p>
        </section>
        <GeneratorForm
          isLoggedIn
          locale={locale}
          dictionary={dictionary}
        />
      </div>
    </main>
  );
}
