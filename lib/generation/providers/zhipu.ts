import "server-only";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";
import type { GenerateImageBytesInput } from "@/lib/generation/providers/types";

const DEFAULT_ZHIPU_API_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_ZHIPU_IMAGE_MODEL = "cogview-3-flash";

type ZhipuImageResponse = {
  data?: Array<{
    url?: string;
  }>;
  error?: {
    message?: string;
  };
  message?: string;
};

export class ImageProviderConfigurationError extends Error {
  code = "IMAGE_PROVIDER_CONFIGURATION";

  constructor(message: string) {
    super(message);
    this.name = "ImageProviderConfigurationError";
  }
}

function getZhipuApiKey() {
  const apiKey = process.env.ZHIPU_API_KEY?.trim();

  if (!apiKey) {
    throw new ImageProviderConfigurationError(
      "ZHIPU_API_KEY is required when IMAGE_PROVIDER is zhipu."
    );
  }

  return apiKey;
}

function getZhipuApiBaseUrl() {
  return (
    process.env.ZHIPU_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_ZHIPU_API_BASE_URL
  );
}

function getZhipuImageModel() {
  return process.env.ZHIPU_IMAGE_MODEL?.trim() || DEFAULT_ZHIPU_IMAGE_MODEL;
}

function getZhipuErrorMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const response = payload as ZhipuImageResponse;
  return response.error?.message ?? response.message ?? null;
}

async function readJsonResponse(response: Response) {
  try {
    return (await response.json()) as ZhipuImageResponse;
  } catch {
    return null;
  }
}

function getImageUrl(payload: ZhipuImageResponse | null) {
  return payload?.data?.find((item) => item.url)?.url;
}

export async function generateZhipuImageBytes({
  prompt,
  aspectRatio
}: GenerateImageBytesInput) {
  const response = await fetch(`${getZhipuApiBaseUrl()}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getZhipuApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getZhipuImageModel(),
      prompt,
      quality: "standard",
      size: getImageSizeForAspectRatio(aspectRatio),
      n: 1
    })
  });
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    const message = getZhipuErrorMessage(payload) ?? response.statusText;
    throw new Error(`Zhipu image generation failed: ${response.status} ${message}`);
  }

  const imageUrl = getImageUrl(payload);

  if (!imageUrl) {
    throw new Error("Zhipu image response did not include an image URL.");
  }

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `Zhipu generated image download failed: ${imageResponse.status} ${imageResponse.statusText}`
    );
  }

  return Buffer.from(await imageResponse.arrayBuffer());
}
