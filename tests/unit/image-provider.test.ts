import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateOpenAIImageBytes } = vi.hoisted(() => ({
  generateOpenAIImageBytes: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/generation/openai", () => ({
  generateImageBytes: generateOpenAIImageBytes
}));

const originalImageProvider = process.env.IMAGE_PROVIDER;
const originalZhipuApiKey = process.env.ZHIPU_API_KEY;
const originalZhipuImageModel = process.env.ZHIPU_IMAGE_MODEL;
const originalZhipuApiBaseUrl = process.env.ZHIPU_API_BASE_URL;

async function importProvider() {
  vi.resetModules();
  return import("@/lib/generation/providers");
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("image generation provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ZHIPU_API_KEY = "zhipu-test-key";
    delete process.env.IMAGE_PROVIDER;
    delete process.env.ZHIPU_IMAGE_MODEL;
    delete process.env.ZHIPU_API_BASE_URL;
  });

  afterEach(() => {
    restoreEnv("IMAGE_PROVIDER", originalImageProvider);
    restoreEnv("ZHIPU_API_KEY", originalZhipuApiKey);
    restoreEnv("ZHIPU_IMAGE_MODEL", originalZhipuImageModel);
    restoreEnv("ZHIPU_API_BASE_URL", originalZhipuApiBaseUrl);
    vi.unstubAllGlobals();
  });

  it("uses Zhipu cogview-3-flash by default and downloads the generated image URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          created: 1,
          data: [{ url: "https://example.com/generated.png" }]
        })
      )
      .mockResolvedValueOnce(
        new Response(Buffer.from("zhipu image bytes"), {
          headers: { "Content-Type": "image/png" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const { generateImageBytes } = await importProvider();

    const imageBytes = await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "16:9"
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://open.bigmodel.cn/api/paas/v4/images/generations",
      expect.anything()
    );
    expect(request.method).toBe("POST");
    expect(request.headers).toMatchObject({
      Authorization: "Bearer zhipu-test-key",
      "Content-Type": "application/json"
    });
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "cogview-3-flash",
      prompt: "A clean product hero image",
      quality: "standard",
      size: "1536x864"
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://example.com/generated.png");
    expect(imageBytes).toEqual(Buffer.from("zhipu image bytes"));
  });

  it("lets IMAGE_PROVIDER=openai use the existing OpenAI wrapper", async () => {
    process.env.IMAGE_PROVIDER = "openai";
    generateOpenAIImageBytes.mockResolvedValueOnce(Buffer.from("openai bytes"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { generateImageBytes } = await importProvider();

    const imageBytes = await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "1:1"
    });

    expect(generateOpenAIImageBytes).toHaveBeenCalledWith({
      prompt: "A clean product hero image",
      aspectRatio: "1:1"
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(imageBytes).toEqual(Buffer.from("openai bytes"));
  });

  it("throws a provider configuration error when ZHIPU_API_KEY is missing", async () => {
    delete process.env.ZHIPU_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { generateImageBytes } = await importProvider();

    await expect(
      generateImageBytes({
        prompt: "A clean product hero image",
        aspectRatio: "1:1"
      })
    ).rejects.toMatchObject({
      code: "IMAGE_PROVIDER_CONFIGURATION",
      message: "ZHIPU_API_KEY is required when IMAGE_PROVIDER is zhipu."
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the Zhipu response does not include an image URL", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const { generateImageBytes } = await importProvider();

    await expect(
      generateImageBytes({
        prompt: "A clean product hero image",
        aspectRatio: "1:1"
      })
    ).rejects.toThrow("Zhipu image response did not include an image URL.");
  });
});
