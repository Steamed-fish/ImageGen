"use server";

import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import {
  buildAuthCallbackUrl,
  buildLoginPath,
  getSafeRedirectPath
} from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
  messageKey?: "checkEmail";
};

const MIN_PASSWORD_LENGTH = 6;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  return { email, password };
}

function invalidCredentialsState(): AuthActionState {
  return {
    status: "error",
    message: "Enter a valid email and a password with at least 6 characters."
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signInWithGoogle(next = "/generate") {
  const supabase = await createSupabaseServerClient();
  const safeNext = getSafeRedirectPath(next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildAuthCallbackUrl(safeNext)
    }
  });

  if (error || !data.url) {
    redirect(
      buildLoginPath(
        safeNext,
        error?.message ?? "Google login is not configured for this project."
      )
    );
  }

  redirect(data.url);
}

export async function signInWithEmail(
  next: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);

  if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
    return invalidCredentialsState();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: error?.message ?? "Unable to sign in with those credentials."
    };
  }

  await ensureProfile(data.user);
  redirect(getSafeRedirectPath(next));
}

export async function signUpWithEmail(
  next: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const { email, password } = readCredentials(formData);

  if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
    return invalidCredentialsState();
  }

  const safeNext = getSafeRedirectPath(next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(safeNext)
    }
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  if (data.session && data.user) {
    await ensureProfile(data.user);
    redirect(safeNext);
  }

  return {
    status: "success",
    message: "Check your email to confirm your account.",
    messageKey: "checkEmail"
  };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
