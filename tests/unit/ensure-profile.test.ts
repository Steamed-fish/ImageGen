import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureProfile } from "@/lib/auth/ensure-profile";

const maybeSingle = vi.fn();
const insertProfile = vi.fn();
const insertTransaction = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle
            })
          }),
          insert: insertProfile
        };
      }

      if (table === "credit_transactions") {
        return {
          insert: insertTransaction
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  })
}));

const user = {
  id: "7fd61c8b-3256-4824-a72c-c54f26bb84e9",
  aud: "authenticated",
  email: "alex@example.com",
  app_metadata: {},
  created_at: "2026-06-29T00:00:00.000Z",
  user_metadata: {
    name: "Alex Example",
    avatar_url: "https://example.com/avatar.png"
  }
} as User;

describe("ensureProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    insertProfile.mockResolvedValue({ error: null });
    insertTransaction.mockResolvedValue({ error: null });
  });

  it("creates a profile and signup credit transaction for new users", async () => {
    await ensureProfile(user);

    expect(insertProfile).toHaveBeenCalledWith({
      id: user.id,
      email: "alex@example.com",
      display_name: "Alex Example",
      avatar_url: "https://example.com/avatar.png",
      credits_balance: 5
    });
    expect(insertTransaction).toHaveBeenCalledWith({
      user_id: user.id,
      amount: 5,
      reason: "signup_bonus"
    });
  });

  it("does not insert duplicates when a profile already exists", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: { id: user.id },
      error: null
    });

    await ensureProfile(user);

    expect(insertProfile).not.toHaveBeenCalled();
    expect(insertTransaction).not.toHaveBeenCalled();
  });
});
