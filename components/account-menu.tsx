import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/config";

type AccountMenuProps = {
  email: string | null;
  labels: Dictionary["account"];
};

export function AccountMenu({ email, labels }: AccountMenuProps) {
  if (!email) {
    return (
      <Button asChild size="sm" className="shrink-0">
        <Link href="/login?next=%2Fgenerate">
          <LogIn className="h-4 w-4" />
          {labels.signIn}
        </Link>
      </Button>
    );
  }

  return (
    <form
      action={signOut}
      className="flex min-w-0 items-center gap-2 sm:gap-3"
    >
      <span className="min-w-0 max-w-20 truncate text-sm text-muted sm:max-w-48">
        {email}
      </span>
      <Button variant="outline" size="sm" className="shrink-0">
        <LogOut className="h-4 w-4" />
        {labels.signOut}
      </Button>
    </form>
  );
}
