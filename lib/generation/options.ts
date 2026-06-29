import type {
  AspectRatio,
  ImageType,
  Scene,
  VisualStyle,
  Whitespace
} from "@/lib/types";

export const IMAGE_TYPES: Record<ImageType, { label: string; prompt: string }> = {
  poster: { label: "Poster", prompt: "poster" },
  cover: { label: "Cover image", prompt: "cover image" },
  social: { label: "Social media image", prompt: "social media image" },
  product: { label: "Product image", prompt: "product image" },
  illustration: { label: "Illustration", prompt: "illustration" },
  avatar: { label: "Avatar", prompt: "avatar" },
  wallpaper: { label: "Wallpaper", prompt: "wallpaper" },
  icon_logo: { label: "Icon or logo concept", prompt: "icon or logo concept" }
};

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; prompt: string }> = {
  "1:1": { label: "1:1", prompt: "square 1:1 composition" },
  "4:5": { label: "4:5", prompt: "vertical 4:5 composition" },
  "16:9": { label: "16:9", prompt: "wide 16:9 composition" },
  "9:16": { label: "9:16", prompt: "vertical 9:16 composition" },
  "3:2": { label: "3:2", prompt: "landscape 3:2 composition" }
};

export const VISUAL_STYLES: Record<VisualStyle, { label: string; prompt: string }> = {
  photorealistic: { label: "Photorealistic", prompt: "photorealistic visual style" },
  editorial: {
    label: "Editorial",
    prompt: "editorial magazine-inspired visual style"
  },
  minimal: { label: "Minimal", prompt: "minimal, clean visual style" },
  "3d_render": { label: "3D render", prompt: "polished 3D render style" },
  watercolor: { label: "Watercolor", prompt: "soft watercolor illustration style" },
  cinematic: { label: "Cinematic", prompt: "cinematic lighting and framing" },
  flat_illustration: {
    label: "Flat illustration",
    prompt: "flat vector illustration style"
  },
  luxury: { label: "Luxury", prompt: "luxury brand visual style" }
};

export const SCENES: Record<Scene, { label: string; prompt: string }> = {
  studio: { label: "Studio", prompt: "studio setting" },
  outdoor: { label: "Outdoor", prompt: "outdoor setting" },
  urban: { label: "Urban", prompt: "urban environment" },
  nature: { label: "Nature", prompt: "natural environment" },
  interior: { label: "Interior", prompt: "interior setting" },
  abstract: { label: "Abstract", prompt: "abstract scene" },
  product_setup: { label: "Product setup", prompt: "carefully arranged product setup" },
  lifestyle: { label: "Lifestyle", prompt: "natural lifestyle scene" }
};

export const WHITESPACE: Record<Whitespace, { label: string; prompt: string }> = {
  none: { label: "No special whitespace", prompt: "Use a balanced composition." },
  top_text_space: {
    label: "Top text space",
    prompt: "Reserve clean negative space near the top for a text overlay."
  },
  left_text_space: {
    label: "Left text space",
    prompt: "Reserve clean negative space on the left for a text overlay."
  },
  right_text_space: {
    label: "Right text space",
    prompt: "Reserve clean negative space on the right for a text overlay."
  },
  center_subject_clean_bg: {
    label: "Center subject with clean background",
    prompt: "Keep the subject centered with a clean, uncluttered background."
  }
};

export const DEFAULT_GENERATION_INPUT = {
  imageType: "poster",
  aspectRatio: "1:1",
  style: "editorial",
  scene: "studio",
  whitespace: "none",
  subject: "",
  extraRequirements: ""
} satisfies {
  imageType: ImageType;
  aspectRatio: AspectRatio;
  style: VisualStyle;
  scene: Scene;
  whitespace: Whitespace;
  subject: string;
  extraRequirements: string;
};
