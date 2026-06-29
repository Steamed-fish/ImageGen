import { z } from "zod";

export const generationRequestSchema = z.object({
  imageType: z.enum([
    "poster",
    "cover",
    "social",
    "product",
    "illustration",
    "avatar",
    "wallpaper",
    "icon_logo"
  ]),
  aspectRatio: z.enum(["1:1", "4:5", "16:9", "9:16", "3:2"]),
  style: z.enum([
    "photorealistic",
    "editorial",
    "minimal",
    "3d_render",
    "watercolor",
    "cinematic",
    "flat_illustration",
    "luxury"
  ]),
  scene: z.enum([
    "studio",
    "outdoor",
    "urban",
    "nature",
    "interior",
    "abstract",
    "product_setup",
    "lifestyle"
  ]),
  whitespace: z.enum([
    "none",
    "top_text_space",
    "left_text_space",
    "right_text_space",
    "center_subject_clean_bg"
  ]),
  subject: z.string().trim().min(1).max(180),
  extraRequirements: z.string().trim().max(500).default("")
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
