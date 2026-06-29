import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureProfile(user: User) {
  const admin = createSupabaseAdminClient();
  const email = user.email ?? "";
  const displayName =
    typeof user.user_metadata.name === "string" ? user.user_metadata.name : null;
  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    email,
    display_name: displayName,
    avatar_url: avatarUrl,
    credits_balance: 5
  });

  if (profileError) {
    throw profileError;
  }

  const { error: transactionError } = await admin
    .from("credit_transactions")
    .insert({
      user_id: user.id,
      amount: 5,
      reason: "signup_bonus"
    });

  if (transactionError) {
    throw transactionError;
  }
}
