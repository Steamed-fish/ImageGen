import "server-only";
import OpenAI from "openai";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";
import type { AspectRatio } from "@/lib/types";

type GenerateImageBytesInput = {
  prompt: string;
  aspectRatio: AspectRatio;
};

export async function generateImageBytes({
  prompt,
  aspectRatio
}: GenerateImageBytesInput) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const response = await openai.images.generate({
    model: "gpt-image-2",
    prompt,
    quality: "medium",
    response_format: "b64_json",
    size: getImageSizeForAspectRatio(aspectRatio)
  });
  const imageBase64 = response.data?.[0]?.b64_json;

  if (!imageBase64) {
    throw new Error("OpenAI image response did not include image data.");
  }

  return Buffer.from(imageBase64, "base64");
}
