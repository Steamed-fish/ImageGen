import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { CreditBadge } from "@/components/credit-badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function AppHeader() {
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
    <header className="border-b border-line bg-canvas/95 px-4 py-3 sm:px-6 sm:py-4">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 sm:flex-nowrap">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold text-ink sm:text-lg"
        >
          Prompt Studio
        </Link>
        <div className="order-last flex w-full items-center gap-4 sm:order-none sm:w-auto">
          <Link href="/generate" className="text-sm text-muted hover:text-ink">
            Generate
          </Link>
          <Link href="/history" className="text-sm text-muted hover:text-ink">
            History
          </Link>
        </div>
        <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-4">
          <CreditBadge credits={credits} />
          <AccountMenu email={user?.email ?? null} />
        </div>
      </nav>
    </header>
  );
}
