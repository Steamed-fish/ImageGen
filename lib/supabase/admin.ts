import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createE2eSupabaseClient, isE2eTestMode } from "@/lib/testing/e2e";

export function createSupabaseAdminClient() {
  if (isE2eTestMode()) {
    return createE2eSupabaseClient(true) as unknown as ReturnType<
      typeof createClient
    >;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
