import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const createSupabaseServerClient = vi.fn();
const ensureProfile = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));
vi.mock("@/lib/auth/ensure-profile", () => ({ ensureProfile }));

function formData(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs in with email and password, ensures the profile, and redirects", async () => {
    const user = { id: "user-id", email: "alex@example.com" };
    const signInWithPassword = vi.fn(async () => ({
      data: { user },
      error: null
    }));
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { signInWithPassword }
    });

    const { signInWithEmail } = await import("@/lib/auth/actions");

    await expect(
      signInWithEmail(
        "/generate",
        { status: "idle", message: null },
        formData({ email: " alex@example.com ", password: "secret123" })
      )
    ).rejects.toThrow("NEXT_REDIRECT:/generate");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "secret123"
    });
    expect(ensureProfile).toHaveBeenCalledWith(user);
  });

  it("returns an error state when email sign-in fails", async () => {
    const signInWithPassword = vi.fn(async () => ({
      data: { user: null },
      error: { message: "Invalid login credentials" }
    }));
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { signInWithPassword }
    });

    const { signInWithEmail } = await import("@/lib/auth/actions");

    await expect(
      signInWithEmail(
        "/generate",
        { status: "idle", message: null },
        formData({ email: "alex@example.com", password: "wrong-password" })
      )
    ).resolves.toMatchObject({
      status: "error",
      message: "Invalid login credentials"
    });
    expect(redirect).not.toHaveBeenCalled();
    expect(ensureProfile).not.toHaveBeenCalled();
  });

  it("registers with email and password using the auth callback redirect", async () => {
    const signUp = vi.fn(async () => ({
      data: { user: { id: "user-id", email: "alex@example.com" }, session: null },
      error: null
    }));
    createSupabaseServerClient.mockResolvedValueOnce({
      auth: { signUp }
    });

    const { signUpWithEmail } = await import("@/lib/auth/actions");

    await expect(
      signUpWithEmail(
        "/generate",
        { status: "idle", message: null },
        formData({ email: "alex@example.com", password: "secret123" })
      )
    ).resolves.toMatchObject({ status: "success" });

    expect(signUp).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "secret123",
      options: {
        emailRedirectTo:
          "http://localhost:3000/auth/callback?next=%2Fgenerate"
      }
    });
    expect(ensureProfile).not.toHaveBeenCalled();
  });
});
