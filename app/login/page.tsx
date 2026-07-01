import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import {
  cleanAuthMessage,
  getSafeRedirectPath
} from "@/lib/auth/redirects";
import { getDictionary } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const next = getSafeRedirectPath(readSearchValue(resolvedSearchParams, "next"));
  const initialError = readSearchValue(resolvedSearchParams, "error");
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  return (
    <main className="min-h-screen px-4 py-8 text-ink sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-center">
        <div className="rounded-2xl border border-line bg-night p-6 text-white shadow-panel sm:p-8 lg:min-h-[520px]">
          <p className="text-sm font-semibold text-accent">
            {dictionary.login.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            {dictionary.login.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            {dictionary.login.description}
          </p>
          <div className="mt-10 grid gap-3 text-sm text-white/78 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              10 {dictionary.account.credits}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {locale === "zh" ? "Prompt 预览" : "Prompt preview"}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {locale === "zh" ? "私有作品库" : "Private library"}
            </div>
          </div>
        </div>
        <AuthForm
          labels={dictionary.login}
          next={next}
          initialError={initialError ? cleanAuthMessage(initialError) : null}
        />
      </section>
    </main>
  );
}
