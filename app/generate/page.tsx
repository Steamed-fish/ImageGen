import { GeneratorForm } from "@/components/generator-form";
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

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl">
        <GeneratorForm
          isLoggedIn={Boolean(user)}
          locale={locale}
          dictionary={dictionary}
        />
      </div>
    </main>
  );
}
