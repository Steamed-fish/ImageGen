"use client";

import { signInWithGoogle } from "@/lib/auth/actions";

export function AuthDialog({ open }: { open: boolean }) {
  if (!open) {
    return null;
  }

  const signInAction = signInWithGoogle.bind(null, "/generate");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-soft"
      >
        <h2 id="auth-dialog-title" className="text-xl font-semibold text-ink">
          Sign in to generate
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You can prepare the prompt before signing in. Google login is required
          when you create the image.
        </p>
        <form action={signInAction}>
          <button className="mt-5 w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
