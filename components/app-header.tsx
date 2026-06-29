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
    <header className="border-b border-line bg-canvas/95 px-6 py-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold text-ink">
          Prompt Studio
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/generate" className="text-sm text-muted hover:text-ink">
            Generate
          </Link>
          <Link href="/history" className="text-sm text-muted hover:text-ink">
            History
          </Link>
          <CreditBadge credits={credits} />
          <AccountMenu email={user?.email ?? null} />
        </div>
      </nav>
    </header>
  );
}
