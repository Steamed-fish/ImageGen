export type ImageType =
  | "poster"
  | "cover"
  | "social"
  | "product"
  | "illustration"
  | "avatar"
  | "wallpaper"
  | "icon_logo";

export type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16" | "3:2";

export type VisualStyle =
  | "photorealistic"
  | "editorial"
  | "minimal"
  | "3d_render"
  | "watercolor"
  | "cinematic"
  | "flat_illustration"
  | "luxury";

export type Scene =
  | "studio"
  | "outdoor"
  | "urban"
  | "nature"
  | "interior"
  | "abstract"
  | "product_setup"
  | "lifestyle";

export type Whitespace =
  | "none"
  | "top_text_space"
  | "left_text_space"
  | "right_text_space"
  | "center_subject_clean_bg";

export type GenerationInput = {
  imageType: ImageType;
  aspectRatio: AspectRatio;
  style: VisualStyle;
  scene: Scene;
  whitespace: Whitespace;
  subject: string;
  extraRequirements: string;
};

export type GenerationStatus = "processing" | "completed" | "failed";
