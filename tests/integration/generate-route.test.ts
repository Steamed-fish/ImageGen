import { beforeEach, describe, expect, it, vi } from "vitest";

const validRequestBody = {
  imageType: "poster",
  aspectRatio: "16:9",
  style: "editorial",
  scene: "studio",
  whitespace: "none",
  subject: "a coffee brand launch poster",
  extraRequirements: "Use warm light."
};

const user = {
  id: "7fd61c8b-3256-4824-a72c-c54f26bb84e9",
  email: "alex@example.com"
};

const getUser = vi.fn();
const from = vi.fn();
const generationJobsUpdate = vi.fn();
const rpc = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();
const generateImageBytes = vi.fn();

type TableName = "generation_jobs" | "profiles";

type RouteDependencies = {
  processingJob?: unknown;
  processingJobError?: unknown;
  profile?: { credits_balance: number } | null;
  profileError?: unknown;
  insertedJob?: { id: string };
  insertError?: unknown;
};

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function tableMock({
  processingJob = null,
  processingJobError = null,
  profile = { credits_balance: 5 },
  profileError = null,
  insertedJob = { id: "generation-id" },
  insertError = null
}: RouteDependencies = {}) {
  return (table: TableName) => {
    if (table === "generation_jobs") {
      return {
        update: generationJobsUpdate,
        select: vi.fn((columns?: string) => {
          if (columns === "id") {
            return {
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: processingJob,
                    error: processingJobError
                  })
                }))
              }))
            };
          }

          return {
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: insertedJob,
                error: insertError
              })
            }))
          };
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: insertedJob,
              error: insertError
            })
          })
        })
      };
    }

    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: profile,
              error: profileError
            })
          }))
        }))
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  };
}

async function importRoute(dependencies: RouteDependencies = {}) {
  vi.resetModules();
  vi.clearAllMocks();

  getUser.mockResolvedValue({ data: { user }, error: null });
  from.mockImplementation(tableMock(dependencies));
  generationJobsUpdate.mockReturnValue({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        lt: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))
    }))
  });
  upload.mockResolvedValue({ data: { path: "stored/path.png" }, error: null });
  createSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.com/generated.png" },
    error: null
  });
  rpc.mockResolvedValue({ data: null, error: null });
  generateImageBytes.mockResolvedValue(Buffer.from("fake-image"));

  vi.doMock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(() => ({
      auth: { getUser }
    }))
  }));
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: vi.fn(() => ({
      from,
      rpc,
      storage: {
        from: vi.fn(() => ({
          upload,
          createSignedUrl
        }))
      }
    }))
  }));
  vi.doMock("@/lib/generation/providers", () => ({
    generateImageBytes
  }));

  return import("@/app/api/generate/route");
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    const { POST } = await importRoute();
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({
      code: "UNAUTHENTICATED"
    });
    expect(from).not.toHaveBeenCalled();
    expect(generateImageBytes).not.toHaveBeenCalled();
  });

  it("returns 402 when the profile does not have enough credits", async () => {
    const { POST } = await importRoute({
      profile: { credits_balance: 0 }
    });

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(402);
    expect(payload).toMatchObject({
      code: "INSUFFICIENT_CREDITS"
    });
    expect(generateImageBytes).not.toHaveBeenCalled();
  });

  it("generates, uploads, charges, and returns the signed image URL", async () => {
    const { POST } = await importRoute();

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(generateImageBytes).toHaveBeenCalledWith({
      prompt: expect.stringContaining("Create a poster about a coffee brand launch poster"),
      aspectRatio: "16:9"
    });
    expect(upload).toHaveBeenCalledWith(
      `${user.id}/generation-id.png`,
      Buffer.from("fake-image"),
      {
        contentType: "image/png",
        upsert: false
      }
    );
    expect(rpc).toHaveBeenCalledWith("complete_generation_and_charge", {
      p_user_id: user.id,
      p_generation_id: "generation-id",
      p_storage_path: `${user.id}/generation-id.png`
    });
    expect(createSignedUrl).toHaveBeenCalledWith(
      `${user.id}/generation-id.png`,
      60 * 60
    );
    expect(payload).toMatchObject({
      id: "generation-id",
      imageUrl: "https://example.com/generated.png",
      compiledPrompt: expect.stringContaining(
        "Create a poster about a coffee brand launch poster"
      )
    });
  });

  it("marks stale processing jobs failed before starting a new generation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T10:00:00.000Z"));
    const updateLt = vi.fn().mockResolvedValue({ data: null, error: null });
    const updateSecondEq = vi.fn(() => ({ lt: updateLt }));
    const updateFirstEq = vi.fn(() => ({ eq: updateSecondEq }));
    generationJobsUpdate.mockReturnValueOnce({ eq: updateFirstEq });

    try {
      const { POST } = await importRoute();

      const response = await POST(createJsonRequest(validRequestBody));

      expect(response.status).toBe(200);
      expect(generationJobsUpdate).toHaveBeenCalledWith({
        status: "failed",
        error_message: "Generation expired before completion.",
        completed_at: "2026-06-30T10:00:00.000Z"
      });
      expect(updateFirstEq).toHaveBeenCalledWith("user_id", user.id);
      expect(updateSecondEq).toHaveBeenCalledWith("status", "processing");
      expect(updateLt).toHaveBeenCalledWith(
        "created_at",
        "2026-06-30T09:45:00.000Z"
      );
      expect(generateImageBytes).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns 500 when stale processing job cleanup fails", async () => {
    const updateLt = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("cleanup failed")
    });
    generationJobsUpdate.mockReturnValueOnce({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          lt: updateLt
        }))
      }))
    });
    const { POST } = await importRoute();

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({
      code: "STALE_GENERATION_CLEANUP_FAILED"
    });
    expect(generateImageBytes).not.toHaveBeenCalled();
  });

  it("marks the job failed and does not charge credits when generation fails", async () => {
    const { POST } = await importRoute();
    generateImageBytes.mockRejectedValueOnce(new Error("OpenAI unavailable"));

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toMatchObject({
      code: "GENERATION_FAILED",
      error: expect.stringContaining("credits were not charged")
    });
    expect(rpc).toHaveBeenCalledWith("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: "generation-id",
      p_error_message: "OpenAI unavailable"
    });
    expect(rpc).not.toHaveBeenCalledWith(
      "complete_generation_and_charge",
      expect.anything()
    );
  });

  it("returns 504 when OpenAI image generation times out", async () => {
    const { POST } = await importRoute();
    generateImageBytes.mockRejectedValueOnce(new Error("Request timed out."));

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(504);
    expect(payload).toMatchObject({
      code: "OPENAI_TIMEOUT"
    });
    expect(rpc).toHaveBeenCalledWith("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: "generation-id",
      p_error_message: "Request timed out."
    });
  });

  it("returns 503 when the OpenAI account billing hard limit is reached", async () => {
    const { POST } = await importRoute();
    generateImageBytes.mockRejectedValueOnce({
      message: "Billing hard limit has been reached.",
      code: "billing_hard_limit_reached",
      type: "billing_limit_user_error"
    });

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      code: "OPENAI_BILLING_LIMIT"
    });
    expect(rpc).toHaveBeenCalledWith("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: "generation-id",
      p_error_message: "Billing hard limit has been reached."
    });
  });

  it("returns 503 when the configured image provider is missing credentials", async () => {
    const { POST } = await importRoute();
    generateImageBytes.mockRejectedValueOnce({
      message: "ZHIPU_API_KEY is required when IMAGE_PROVIDER is zhipu.",
      code: "IMAGE_PROVIDER_CONFIGURATION"
    });

    const response = await POST(createJsonRequest(validRequestBody));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      code: "IMAGE_PROVIDER_CONFIGURATION"
    });
    expect(rpc).toHaveBeenCalledWith("mark_generation_failed", {
      p_user_id: user.id,
      p_generation_id: "generation-id",
      p_error_message: "ZHIPU_API_KEY is required when IMAGE_PROVIDER is zhipu."
    });
  });
});
