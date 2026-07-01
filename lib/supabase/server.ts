import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  createE2eSupabaseClient,
  E2E_AUTH_COOKIE,
  isE2eTestMode
} from "@/lib/testing/e2e";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  if (isE2eTestMode()) {
    return createE2eSupabaseClient(
      cookieStore.get(E2E_AUTH_COOKIE)?.value === "1"
    ) as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
