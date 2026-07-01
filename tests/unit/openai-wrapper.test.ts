import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateMock, OpenAIMock } = vi.hoisted(() => {
  const generateMock = vi.fn();
  const OpenAIMock = vi.fn(() => ({
    images: {
      generate: generateMock
    }
  }));

  return { generateMock, OpenAIMock };
});

vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: OpenAIMock
}));

const originalApiKey = process.env.OPENAI_API_KEY;
const originalProxyUrl = process.env.OPENAI_PROXY_URL;

describe("generateImageBytes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
    delete process.env.OPENAI_PROXY_URL;
    generateMock.mockResolvedValue(
      (async function* () {
        yield {
          type: "image_generation.partial_image",
          b64_json: Buffer.from("partial png bytes").toString("base64")
        };
        yield {
          type: "image_generation.completed",
          b64_json: Buffer.from("png image bytes").toString("base64")
        };
      })()
    );
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
      return;
    }

    process.env.OPENAI_API_KEY = originalApiKey;

    if (originalProxyUrl === undefined) {
      delete process.env.OPENAI_PROXY_URL;
      return;
    }

    process.env.OPENAI_PROXY_URL = originalProxyUrl;
  });

  it("configures a proxy dispatcher when OPENAI_PROXY_URL is set", async () => {
    process.env.OPENAI_PROXY_URL = "http://127.0.0.1:7890";
    const { generateImageBytes } = await import("@/lib/generation/openai");

    await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "16:9"
    });

    expect(OpenAIMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchOptions: expect.objectContaining({
          dispatcher: expect.anything()
        })
      })
    );
  });

  it("streams GPT Image with a PNG output format and decodes the completed image bytes", async () => {
    const { generateImageBytes } = await import("@/lib/generation/openai");

    const imageBytes = await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "16:9"
    });
    const request = generateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(OpenAIMock).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      timeout: 120000
    });
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(request).toMatchObject({
      model: "gpt-image-2",
      prompt: "A clean product hero image",
      quality: "medium",
      size: "1536x864",
      stream: true,
      partial_images: 1
    });
    expect(request).not.toHaveProperty("response_format");
    expect(request).toHaveProperty("output_format", "png");
    expect(imageBytes).toEqual(Buffer.from("png image bytes"));
  });

  it("falls back to a non-streaming response shape in tests or SDK compatibility cases", async () => {
    const { generateImageBytes } = await import("@/lib/generation/openai");
    generateMock.mockResolvedValueOnce({
      created: 0,
      data: [
        {
          b64_json: Buffer.from("png image bytes").toString("base64")
        }
      ]
    });

    const imageBytes = await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "16:9"
    });

    expect(imageBytes).toEqual(Buffer.from("png image bytes"));
  });

  it("throws when the image stream omits completed base64 data", async () => {
    const { generateImageBytes } = await import("@/lib/generation/openai");
    generateMock.mockResolvedValueOnce(
      (async function* () {
        yield {
          type: "image_generation.partial_image",
          b64_json: Buffer.from("partial png bytes").toString("base64")
        };
      })()
    );

    await expect(
      generateImageBytes({
        prompt: "A clean product hero image",
        aspectRatio: "1:1"
      })
    ).rejects.toThrow("OpenAI image response did not include image data.");
  });
});
