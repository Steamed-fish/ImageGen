import { LogIn, LogOut } from "lucide-react";
import { signInWithGoogle, signOut } from "@/lib/auth/actions";

type AccountMenuProps = {
  email: string | null;
};

export function AccountMenu({ email }: AccountMenuProps) {
  if (!email) {
    return (
      <form
        action={async () => {
          "use server";
          await signInWithGoogle("/generate");
        }}
      >
        <button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
      </form>
    );
  }

  return (
    <form action={signOut} className="inline-flex items-center gap-3">
      <span className="max-w-48 truncate text-sm text-muted">{email}</span>
      <button className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
