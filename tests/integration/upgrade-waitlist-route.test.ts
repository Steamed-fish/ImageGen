import { beforeEach, describe, expect, it, vi } from "vitest";

const user = {
  id: "7fd61c8b-3256-4824-a72c-c54f26bb84e9",
  email: "alex@example.com"
};

const getUser = vi.fn();
const from = vi.fn();
const upsert = vi.fn();

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/upgrade-waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function createRawRequest(body: string) {
  return new Request("http://localhost/api/upgrade-waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
}

async function importRoute() {
  vi.resetModules();
  vi.clearAllMocks();

  getUser.mockResolvedValue({ data: { user }, error: null });
  upsert.mockResolvedValue({ data: null, error: null });
  from.mockImplementation((table: string) => {
    if (table !== "upgrade_waitlist") {
      throw new Error(`Unexpected table: ${table}`);
    }

    return { upsert };
  });

  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(() => ({
      auth: { getUser }
    }))
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => ({
      from
    }))
  }));

  return import("@/app/api/upgrade-waitlist/route");
}

describe("POST /api/upgrade-waitlist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const { POST } = await importRoute();
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const response = await POST(
      createJsonRequest({ source: "insufficient_credits_modal" })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({
      code: "UNAUTHENTICATED"
    });
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts the authenticated user's trimmed source and returns ok", async () => {
    const { POST } = await importRoute();

    const response = await POST(
      createJsonRequest({ source: " insufficient_credits_modal " })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("upgrade_waitlist");
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: user.id,
        email: user.email,
        source: "insufficient_credits_modal"
      },
      {
        onConflict: "user_id,source",
        ignoreDuplicates: true
      }
    );
    expect(payload).toEqual({ ok: true });
  });

  it("returns 400 for an invalid source and does not write", async () => {
    const { POST } = await importRoute();

    const response = await POST(createJsonRequest({ source: "   " }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON and does not write", async () => {
    const { POST } = await importRoute();

    const response = await POST(createRawRequest("{"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({
      code: "VALIDATION_ERROR"
    });
    expect(from).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns ok when a duplicate waitlist row is ignored", async () => {
    const { POST } = await importRoute();
    upsert.mockResolvedValueOnce({ data: null, error: null });

    const response = await POST(
      createJsonRequest({ source: "insufficient_credits_modal" })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: user.id,
        email: user.email,
        source: "insufficient_credits_modal"
      },
      {
        onConflict: "user_id,source",
        ignoreDuplicates: true
      }
    );
    expect(payload).toEqual({ ok: true });
  });

  it("returns 500 when the waitlist write fails", async () => {
    const { POST } = await importRoute();
    upsert.mockResolvedValueOnce({
      data: null,
      error: new Error("database unavailable")
    });

    const response = await POST(
      createJsonRequest({ source: "insufficient_credits_modal" })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({
      code: "WAITLIST_FAILED"
    });
  });
});
