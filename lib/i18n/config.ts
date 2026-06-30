export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "prompt_studio_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const dictionaries = {
  zh: {
    language: {
      label: "语言",
      zh: "中文",
      en: "English"
    },
    nav: {
      generate: "生成",
      history: "历史"
    },
    account: {
      signIn: "登录",
      signOut: "退出",
      credits: "积分"
    },
    home: {
      eyebrow: "Prompt Studio",
      title: "结构化 AI 图片生成，产出更精致的创意作品。",
      description:
        "选择图片类型、比例、风格、场景和留白。Prompt Studio 会组装专业 GPT Image 提示词，并保存每次生成历史。",
      primaryCta: "开始生成",
      secondaryCta: "查看历史",
      previewLabel: "生成器预览",
      previewTitle: "活动海报设置",
      promptLabel: "最终英文 prompt",
      promptSnippet:
        "Professional GPT Image prompt: Create a 4:5 editorial poster in a clean studio scene, leaving calm top text space for campaign copy and polished product lighting.",
      previewRows: {
        type: ["类型", "海报"],
        ratio: ["比例", "4:5"],
        style: ["风格", "编辑风"],
        scene: ["场景", "影棚"],
        whitespace: ["留白", "顶部文字空间"]
      },
      features: [
        {
          title: "结构化选择",
          description: "先选定关键创意约束，再开始写提示词。"
        },
        {
          title: "Prompt 组装",
          description: "把每个选项拼成一条专业英文 GPT Image prompt。"
        },
        {
          title: "历史保存",
          description: "回看以往生成结果，复用效果好的创意方向。"
        }
      ]
    },
    generator: {
      title: "创建图片",
      fields: {
        imageType: "图片类型",
        aspectRatio: "画面比例",
        style: "风格",
        scene: "场景",
        whitespace: "留白",
        subject: "主题",
        extraRequirements: "补充要求"
      },
      placeholders: {
        subject: "咖啡品牌发布海报",
        extraRequirements: "氛围、颜色、物体、受众、需要避免的细节"
      },
      submit: "生成 1 张图片",
      emptyPrompt: "输入主题后预览专业英文 prompt。",
      signInRequired: "请先使用 Google 登录后再生成图片。",
      genericError: "图片生成失败，请稍后重试。",
      fallbackError: "生成失败。"
    },
    promptPreview: {
      title: "专业英文 prompt",
      badge: "只读"
    },
    result: {
      title: "结果",
      loading: "生成中...",
      empty: "生成的图片会显示在这里。",
      alt: "生成结果"
    },
    authDialog: {
      title: "登录后生成",
      description:
        "你可以先准备 prompt。真正创建图片时，需要使用 Google 登录。",
      continueWithGoogle: "使用 Google 继续"
    },
    upgrade: {
      title: "升级功能即将开放",
      description:
        "你的免费积分已用完。加入候补名单，我们会在付费计划开放时通知你。",
      close: "关闭",
      join: "加入候补名单",
      joined: "已加入"
    },
    history: {
      title: "生成历史",
      emptyTitle: "还没有生成图片",
      emptyDescription: "第一次成功生成后，图片会出现在这里。",
      previewUnavailable: "预览不可用",
      openImage: "打开图片"
    },
    apiErrors: {
      UNAUTHENTICATED: "请先登录后再继续。",
      INSUFFICIENT_CREDITS: "你的免费积分已用完。",
      GENERATION_IN_PROGRESS: "已有图片正在生成，请稍后再试。",
      GENERATION_FAILED: "生成失败，积分不会被扣除。",
      VALIDATION_ERROR: "请检查表单内容。",
      PROFILE_NOT_FOUND: "无法加载账户资料。",
      JOB_CREATE_FAILED: "无法启动生成任务。",
      STALE_GENERATION_CLEANUP_FAILED: "无法恢复上一次未完成的生成任务。"
    }
  },
  en: {
    language: {
      label: "Language",
      zh: "中文",
      en: "English"
    },
    nav: {
      generate: "Generate",
      history: "History"
    },
    account: {
      signIn: "Sign in",
      signOut: "Sign out",
      credits: "credits"
    },
    home: {
      eyebrow: "Prompt Studio",
      title: "Structured image generation for polished creative work.",
      description:
        "Choose image type, ratio, style, scene, and whitespace. Prompt Studio assembles a professional GPT Image prompt and saves every generation to your history.",
      primaryCta: "Start generating",
      secondaryCta: "View history",
      previewLabel: "Generator preview",
      previewTitle: "Campaign poster setup",
      promptLabel: "Compiled prompt",
      promptSnippet:
        "Professional GPT Image prompt: Create a 4:5 editorial poster in a clean studio scene, leaving calm top text space for campaign copy and polished product lighting.",
      previewRows: {
        type: ["Type", "Poster"],
        ratio: ["Ratio", "4:5"],
        style: ["Style", "Editorial"],
        scene: ["Scene", "Studio"],
        whitespace: ["Whitespace", "Top text space"]
      },
      features: [
        {
          title: "Structured choices",
          description:
            "Select the creative constraints that matter before a prompt is written."
        },
        {
          title: "Prompt assembly",
          description: "Turn those choices into one professional GPT Image prompt."
        },
        {
          title: "Saved history",
          description:
            "Return to previous generations and reuse the direction that worked."
        }
      ]
    },
    generator: {
      title: "Create an image",
      fields: {
        imageType: "Image type",
        aspectRatio: "Aspect ratio",
        style: "Style",
        scene: "Scene",
        whitespace: "Whitespace",
        subject: "Subject",
        extraRequirements: "Additional requirements"
      },
      placeholders: {
        subject: "a coffee brand launch poster",
        extraRequirements: "Mood, colors, objects, audience, details to avoid"
      },
      submit: "Generate 1 image",
      emptyPrompt: "Enter a subject to preview the professional prompt.",
      signInRequired: "Please sign in with Google to generate an image.",
      genericError: "We couldn't generate your image. Please try again.",
      fallbackError: "Generation failed."
    },
    promptPreview: {
      title: "Professional prompt",
      badge: "Read-only"
    },
    result: {
      title: "Result",
      loading: "Generating...",
      empty: "Your generated image will appear here.",
      alt: "Generated result"
    },
    authDialog: {
      title: "Sign in to generate",
      description:
        "You can prepare the prompt before signing in. Google login is required when you create the image.",
      continueWithGoogle: "Continue with Google"
    },
    upgrade: {
      title: "Upgrade coming soon",
      description:
        "You have used your free credits. Join the waitlist and we will let you know when paid plans are available.",
      close: "Close",
      join: "Join waitlist",
      joined: "Joined"
    },
    history: {
      title: "Generation history",
      emptyTitle: "No generated images yet",
      emptyDescription:
        "Your completed generations will appear here after the first successful run.",
      previewUnavailable: "Preview unavailable",
      openImage: "Open image"
    },
    apiErrors: {
      UNAUTHENTICATED: "Please sign in to continue.",
      INSUFFICIENT_CREDITS: "You have used your free credits.",
      GENERATION_IN_PROGRESS: "An image is already being generated.",
      GENERATION_FAILED: "Generation failed and credits were not charged.",
      VALIDATION_ERROR: "Please check the form.",
      PROFILE_NOT_FOUND: "Your account profile could not be loaded.",
      JOB_CREATE_FAILED: "Could not start the generation.",
      STALE_GENERATION_CLEANUP_FAILED:
        "We could not recover previous unfinished generations."
    }
  }
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
