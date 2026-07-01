import type { User } from "@supabase/supabase-js";

export const E2E_AUTH_COOKIE = "prompt_studio_e2e_auth";

export function isE2eTestMode() {
  return process.env.E2E_TEST_MODE === "1";
}

export function createE2eUser(): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@example.com",
    email_confirmed_at: "2026-07-01T00:00:00.000Z",
    phone: "",
    confirmed_at: "2026-07-01T00:00:00.000Z",
    last_sign_in_at: "2026-07-01T00:00:00.000Z",
    app_metadata: {},
    user_metadata: {
      name: "E2E User"
    },
    identities: [],
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    is_anonymous: false
  };
}

export function createE2eImageDataUrl() {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#eef7fb"/><circle cx="512" cy="420" r="180" fill="#0ea5b7" opacity="0.22"/><rect x="252" y="610" width="520" height="96" rx="28" fill="#101419"/><text x="512" y="668" font-family="Arial, sans-serif" font-size="34" fill="#ffffff" text-anchor="middle">E2E image mock</text></svg>';

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createQueryResult(table: string) {
  if (table === "profiles") {
    return {
      data: {
        id: createE2eUser().id,
        email: "e2e@example.com",
        display_name: "E2E User",
        avatar_url: null,
        credits_balance: 10,
        created_at: "2026-07-01T00:00:00.000Z"
      },
      error: null
    };
  }

  if (table === "generation_jobs") {
    return { data: [], error: null };
  }

  return { data: null, error: null };
}

export function createE2eSupabaseClient(isAuthenticated: boolean) {
  const user = isAuthenticated ? createE2eUser() : null;

  const builder = (table: string) => {
    const chain = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      eq: () => chain,
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      single: async () => createQueryResult(table),
      maybeSingle: async () => createQueryResult(table),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(createQueryResult(table)).then(resolve)
    };

    return chain;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null })
    },
    from: builder,
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "e2e/mock.png" }, error: null }),
        createSignedUrl: async () => ({
          data: { signedUrl: createE2eImageDataUrl() },
          error: null
        })
      })
    }
  };
}
