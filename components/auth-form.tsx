"use client";

import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AuthActionState,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail
} from "@/lib/auth/actions";
import type { Dictionary } from "@/lib/i18n/config";

type AuthMode = "signin" | "signup";

const INITIAL_AUTH_STATE: AuthActionState = {
  status: "idle",
  message: null
};

export function AuthForm({
  labels,
  next,
  initialError = null
}: {
  labels: Dictionary["login"];
  next: string;
  initialError?: string | null;
}) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [signInState, signInAction, isSigningIn] = useActionState(
    signInWithEmail.bind(null, next),
    INITIAL_AUTH_STATE
  );
  const [signUpState, signUpAction, isSigningUp] = useActionState(
    signUpWithEmail.bind(null, next),
    INITIAL_AUTH_STATE
  );
  const googleAction = signInWithGoogle.bind(null, next);
  const isSignIn = mode === "signin";
  const state = isSignIn ? signInState : signUpState;
  const isPending = isSignIn ? isSigningIn : isSigningUp;
  const activeMessage =
    state.messageKey === "checkEmail" ? labels.checkEmail : state.message;

  return (
    <Card className="p-5 sm:p-6">
      <div
        role="tablist"
        aria-label={labels.modeLabel}
        className="grid grid-cols-2 rounded-xl border border-line bg-shell p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isSignIn}
          onClick={() => setMode("signin")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isSignIn ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <LogIn className="mr-2 inline h-4 w-4 align-[-3px]" />
          {labels.signInTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignIn}
          onClick={() => setMode("signup")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            !isSignIn ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          <UserPlus className="mr-2 inline h-4 w-4 align-[-3px]" />
          {labels.signUpTab}
        </button>
      </div>

      <form action={isSignIn ? signInAction : signUpAction} className="mt-5">
        <label className="block text-sm font-medium text-ink">
          {labels.email}
          <span className="relative mt-2 block">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <Input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="pl-9"
              placeholder={labels.emailPlaceholder}
            />
          </span>
        </label>

        <label className="mt-4 block text-sm font-medium text-ink">
          {labels.password}
          <span className="relative mt-2 block">
            <KeyRound
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <Input
              name="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              required
              minLength={6}
              className="pl-9"
              placeholder={labels.passwordPlaceholder}
            />
          </span>
        </label>

        {(initialError || activeMessage) && (
          <p
            role={state.status === "success" ? "status" : "alert"}
            className={`mt-4 rounded-md border px-3 py-2 text-sm ${
              state.status === "success"
                ? "border-moss/30 bg-moss/10 text-moss"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {activeMessage ?? initialError}
          </p>
        )}

        <Button
          disabled={isPending}
          className="mt-5 w-full"
        >
          {isSignIn ? (
            <LogIn aria-hidden="true" className="h-4 w-4" />
          ) : (
            <UserPlus aria-hidden="true" className="h-4 w-4" />
          )}
          {isPending
            ? labels.pending
            : isSignIn
              ? labels.signInWithEmail
              : labels.signUpWithEmail}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-line" />
        {labels.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={googleAction}>
        <Button variant="outline" className="w-full">
          {labels.continueWithGoogle}
        </Button>
      </form>
    </Card>
  );
}
