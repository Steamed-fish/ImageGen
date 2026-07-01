import type { AspectRatio } from "@/lib/types";

export type GenerateImageBytesInput = {
  prompt: string;
  aspectRatio: AspectRatio;
};

export type ImageProvider = {
  id: "zhipu" | "openai";
  generateImageBytes(input: GenerateImageBytesInput): Promise<Buffer>;
};
