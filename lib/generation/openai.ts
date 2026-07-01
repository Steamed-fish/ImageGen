import "server-only";
import OpenAI from "openai";
import type {
  ImageGenStreamEvent,
  ImagesResponse
} from "openai/resources/images";
import { ProxyAgent } from "undici";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";
import type { AspectRatio } from "@/lib/types";

type GenerateImageBytesInput = {
  prompt: string;
  aspectRatio: AspectRatio;
};

const OPENAI_IMAGE_TIMEOUT_MS = 120_000;

function getProxyUrl() {
  return (
    process.env.OPENAI_PROXY_URL ??
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    null
  );
}

function createOpenAIClient() {
  const proxyUrl = getProxyUrl();
  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: process.env.OPENAI_API_KEY,
    timeout: OPENAI_IMAGE_TIMEOUT_MS
  };

  if (proxyUrl) {
    clientOptions.fetchOptions = {
      dispatcher: new ProxyAgent(proxyUrl)
    } as NonNullable<typeof clientOptions.fetchOptions>;
  }

  return new OpenAI(clientOptions);
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value
  );
}

function imageBytesFromBase64(imageBase64: string | undefined) {
  if (!imageBase64) {
    throw new Error("OpenAI image response did not include image data.");
  }

  return Buffer.from(imageBase64, "base64");
}

export async function generateImageBytes({
  prompt,
  aspectRatio
}: GenerateImageBytesInput) {
  const openai = createOpenAIClient();
  const response = await openai.images.generate({
    model: "gpt-image-2",
    prompt,
    quality: "medium",
    output_format: "png",
    size: getImageSizeForAspectRatio(aspectRatio),
    stream: true,
    partial_images: 1
  });

  if (isAsyncIterable<ImageGenStreamEvent>(response)) {
    let completedImageBase64: string | undefined;

    for await (const event of response) {
      if (event.type === "image_generation.completed") {
        completedImageBase64 = event.b64_json;
      }
    }

    return imageBytesFromBase64(completedImageBase64);
  }

  return imageBytesFromBase64((response as ImagesResponse).data?.[0]?.b64_json);
}
