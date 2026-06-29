import {
  ASPECT_RATIOS,
  IMAGE_TYPES,
  SCENES,
  VISUAL_STYLES,
  WHITESPACE
} from "@/lib/generation/options";
import type { GenerationInput } from "@/lib/types";

function articleFor(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a";
}

export function compilePrompt(input: GenerationInput) {
  const imageType = IMAGE_TYPES[input.imageType].prompt;
  const style = VISUAL_STYLES[input.style].prompt;
  const scene = SCENES[input.scene].prompt;
  const ratio = ASPECT_RATIOS[input.aspectRatio].prompt;
  const whitespace = WHITESPACE[input.whitespace].prompt;
  const subject = input.subject.trim();
  const extra = input.extraRequirements.trim();

  const sentences = [
    `Create ${articleFor(imageType)} ${imageType} about ${subject} in ${style}, set in ${scene}, with ${ratio}.`,
    whitespace
  ];

  if (extra.length > 0) {
    sentences.push(`Additional requirements: ${extra}.`);
  }

  sentences.push(
    "Avoid text artifacts, watermarks, distorted anatomy, low-resolution details, and cluttered composition."
  );

  return sentences.join(" ");
}
