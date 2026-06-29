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

describe("generateImageBytes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-api-key";
    generateMock.mockResolvedValue({
      created: 0,
      data: [
        {
          b64_json: Buffer.from("png image bytes").toString("base64")
        }
      ]
    });
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
      return;
    }

    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("requests GPT Image with a PNG output format and decodes returned base64 image bytes", async () => {
    const { generateImageBytes } = await import("@/lib/generation/openai");

    const imageBytes = await generateImageBytes({
      prompt: "A clean product hero image",
      aspectRatio: "16:9"
    });
    const request = generateMock.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(OpenAIMock).toHaveBeenCalledWith({
      apiKey: "test-api-key"
    });
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(request).toMatchObject({
      model: "gpt-image-2",
      prompt: "A clean product hero image",
      quality: "medium",
      size: "1536x864"
    });
    expect(request).not.toHaveProperty("response_format");
    expect(request).toHaveProperty("output_format", "png");
    expect(imageBytes).toEqual(Buffer.from("png image bytes"));
  });

  it("throws when the image response omits base64 data", async () => {
    const { generateImageBytes } = await import("@/lib/generation/openai");
    generateMock.mockResolvedValueOnce({
      created: 0,
      data: [{}]
    });

    await expect(
      generateImageBytes({
        prompt: "A clean product hero image",
        aspectRatio: "1:1"
      })
    ).rejects.toThrow("OpenAI image response did not include image data.");
  });
});
