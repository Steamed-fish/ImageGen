import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const createSupabaseServerClient = vi.fn();
const ensureProfile = vi.fn();

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("@/lib/auth/ensure-profile", () => ({ ensureProfile }));

async function importRoute() {
  vi.resetModules();
  vi.clearAllMocks();
  createSupabaseServerClient.mockResolvedValue({
    auth: { exchangeCodeForSession, getUser }
  });
  exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
  getUser.mockResolvedValue({ data: { user: null }, error: null });

  return import("@/app/auth/callback/route");
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects OAuth provider errors back to login with a friendly error", async () => {
    const { GET } = await importRoute();

    const response = await GET(
      new Request(
        "http://localhost/auth/callback?next=%2Fgenerate&error=server_error&error_description=Google+provider+is+not+enabled"
      ) as never
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fgenerate&error=Google+provider+is+not+enabled"
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  it("redirects code exchange failures back to login", async () => {
    const { GET } = await importRoute();
    exchangeCodeForSession.mockResolvedValueOnce({
      data: null,
      error: { message: "invalid request" }
    });

    const response = await GET(
      new Request("http://localhost/auth/callback?next=%2Fhistory&code=bad") as never
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fhistory&error=invalid+request"
    );
    expect(ensureProfile).not.toHaveBeenCalled();
  });
});
