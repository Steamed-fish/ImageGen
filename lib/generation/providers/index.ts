import "server-only";
import { generateOpenAIImageBytes } from "@/lib/generation/providers/openai";
import { generateZhipuImageBytes } from "@/lib/generation/providers/zhipu";
import type {
  GenerateImageBytesInput,
  ImageProvider
} from "@/lib/generation/providers/types";

function getConfiguredProviderId(): ImageProvider["id"] {
  const provider = (process.env.IMAGE_PROVIDER ?? "zhipu").toLowerCase();

  if (provider === "openai" || provider === "zhipu") {
    return provider;
  }

  throw new Error(`Unsupported image provider: ${provider}`);
}

function getImageProvider(): ImageProvider {
  const providerId = getConfiguredProviderId();

  if (providerId === "openai") {
    return {
      id: "openai",
      generateImageBytes: generateOpenAIImageBytes
    };
  }

  return {
    id: "zhipu",
    generateImageBytes: generateZhipuImageBytes
  };
}

export async function generateImageBytes(input: GenerateImageBytesInput) {
  return getImageProvider().generateImageBytes(input);
}

export type { GenerateImageBytesInput, ImageProvider };
