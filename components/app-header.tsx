import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { CreditBadge } from "@/components/credit-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AppHeader() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let credits: number | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .maybeSingle();

    credits = data?.credits_balance ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 sm:flex-nowrap">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold text-ink sm:text-lg"
        >
          Prompt Studio
        </Link>
        <div className="order-last flex w-full items-center gap-4 sm:order-none sm:w-auto">
          <Link href="/generate" className="text-sm font-medium text-muted hover:text-ink">
            {dictionary.nav.generate}
          </Link>
          <Link href="/history" className="text-sm font-medium text-muted hover:text-ink">
            {dictionary.nav.history}
          </Link>
          {user ? (
            <Link href="/account" className="text-sm font-medium text-muted hover:text-ink">
              {dictionary.nav.account}
            </Link>
          ) : null}
        </div>
        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-4">
          <LanguageSwitcher locale={locale} labels={dictionary.language} />
          <CreditBadge
            credits={credits}
            label={dictionary.account.credits}
          />
          <AccountMenu
            email={user?.email ?? null}
            labels={dictionary.account}
          />
        </div>
      </nav>
    </header>
  );
}
