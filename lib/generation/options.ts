import type {
  AspectRatio,
  ImageType,
  Scene,
  VisualStyle,
  Whitespace
} from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";

type LocalizedLabel = Record<Locale, string>;

export const IMAGE_TYPES: Record<
  ImageType,
  { label: LocalizedLabel; prompt: string }
> = {
  poster: { label: { zh: "海报", en: "Poster" }, prompt: "poster" },
  cover: { label: { zh: "封面图", en: "Cover image" }, prompt: "cover image" },
  social: {
    label: { zh: "社交媒体图片", en: "Social media image" },
    prompt: "social media image"
  },
  product: {
    label: { zh: "产品图", en: "Product image" },
    prompt: "product image"
  },
  illustration: {
    label: { zh: "插画", en: "Illustration" },
    prompt: "illustration"
  },
  avatar: { label: { zh: "头像", en: "Avatar" }, prompt: "avatar" },
  wallpaper: { label: { zh: "壁纸", en: "Wallpaper" }, prompt: "wallpaper" },
  icon_logo: {
    label: { zh: "图标或 Logo 概念", en: "Icon or logo concept" },
    prompt: "icon or logo concept"
  }
};

export const ASPECT_RATIOS: Record<
  AspectRatio,
  { label: LocalizedLabel; prompt: string }
> = {
  "1:1": { label: { zh: "1:1", en: "1:1" }, prompt: "square 1:1 composition" },
  "4:5": {
    label: { zh: "4:5", en: "4:5" },
    prompt: "vertical 4:5 composition"
  },
  "16:9": {
    label: { zh: "16:9", en: "16:9" },
    prompt: "wide 16:9 composition"
  },
  "9:16": {
    label: { zh: "9:16", en: "9:16" },
    prompt: "vertical 9:16 composition"
  },
  "3:2": {
    label: { zh: "3:2", en: "3:2" },
    prompt: "landscape 3:2 composition"
  }
};

export const VISUAL_STYLES: Record<
  VisualStyle,
  { label: LocalizedLabel; prompt: string }
> = {
  photorealistic: {
    label: { zh: "写实", en: "Photorealistic" },
    prompt: "photorealistic visual style"
  },
  editorial: {
    label: { zh: "编辑风", en: "Editorial" },
    prompt: "editorial magazine-inspired visual style"
  },
  minimal: {
    label: { zh: "极简", en: "Minimal" },
    prompt: "minimal, clean visual style"
  },
  "3d_render": {
    label: { zh: "3D 渲染", en: "3D render" },
    prompt: "polished 3D render style"
  },
  watercolor: {
    label: { zh: "水彩", en: "Watercolor" },
    prompt: "soft watercolor illustration style"
  },
  cinematic: {
    label: { zh: "电影感", en: "Cinematic" },
    prompt: "cinematic lighting and framing"
  },
  flat_illustration: {
    label: { zh: "扁平插画", en: "Flat illustration" },
    prompt: "flat vector illustration style"
  },
  luxury: {
    label: { zh: "奢华", en: "Luxury" },
    prompt: "luxury brand visual style"
  }
};

export const SCENES: Record<Scene, { label: LocalizedLabel; prompt: string }> = {
  studio: { label: { zh: "影棚", en: "Studio" }, prompt: "studio setting" },
  outdoor: { label: { zh: "户外", en: "Outdoor" }, prompt: "outdoor setting" },
  urban: { label: { zh: "城市", en: "Urban" }, prompt: "urban environment" },
  nature: { label: { zh: "自然", en: "Nature" }, prompt: "natural environment" },
  interior: { label: { zh: "室内", en: "Interior" }, prompt: "interior setting" },
  abstract: { label: { zh: "抽象", en: "Abstract" }, prompt: "abstract scene" },
  product_setup: {
    label: { zh: "产品布景", en: "Product setup" },
    prompt: "carefully arranged product setup"
  },
  lifestyle: {
    label: { zh: "生活方式", en: "Lifestyle" },
    prompt: "natural lifestyle scene"
  }
};

export const WHITESPACE: Record<
  Whitespace,
  { label: LocalizedLabel; prompt: string }
> = {
  none: {
    label: { zh: "无特殊留白", en: "No special whitespace" },
    prompt: "Use a balanced composition."
  },
  top_text_space: {
    label: { zh: "顶部文字空间", en: "Top text space" },
    prompt: "Reserve clean negative space near the top for a text overlay."
  },
  left_text_space: {
    label: { zh: "左侧文字空间", en: "Left text space" },
    prompt: "Reserve clean negative space on the left for a text overlay."
  },
  right_text_space: {
    label: { zh: "右侧文字空间", en: "Right text space" },
    prompt: "Reserve clean negative space on the right for a text overlay."
  },
  center_subject_clean_bg: {
    label: {
      zh: "居中主体与干净背景",
      en: "Center subject with clean background"
    },
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
