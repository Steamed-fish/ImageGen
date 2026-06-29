import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

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

  if (!existing) {
    const { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      credits_balance: 5
    });

    if (profileError && !isUniqueViolation(profileError)) {
      throw profileError;
    }
  }

  const { data: existingTransaction, error: existingTransactionError } =
    await admin
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("reason", "signup_bonus")
      .maybeSingle();

  if (existingTransactionError) {
    throw existingTransactionError;
  }

  if (existingTransaction) {
    return;
  }

  const { error: transactionError } = await admin
    .from("credit_transactions")
    .insert({
      user_id: user.id,
      amount: 5,
      reason: "signup_bonus"
    });

  if (transactionError && !isUniqueViolation(transactionError)) {
    throw transactionError;
  }
}
