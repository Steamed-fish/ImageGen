import { LogIn, LogOut } from "lucide-react";
import { signInWithGoogle, signOut } from "@/lib/auth/actions";

type AccountMenuProps = {
  email: string | null;
};

export function AccountMenu({ email }: AccountMenuProps) {
  if (!email) {
    return (
      <form
        className="shrink-0"
        action={async () => {
          "use server";
          await signInWithGoogle("/generate");
        }}
      >
        <button className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-ink px-3 py-2 text-sm font-medium text-white sm:px-4">
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
      </form>
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
      <button className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
