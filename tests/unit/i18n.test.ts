import { describe, expect, it } from "vitest";
import { IMAGE_TYPES } from "@/lib/generation/options";
import { compilePrompt } from "@/lib/generation/prompt";
import {
  DEFAULT_LOCALE,
  getDictionary,
  isLocale,
  normalizeLocale
} from "@/lib/i18n/config";

describe("i18n language policy", () => {
  it("defaults to Chinese and exposes English and Chinese dictionaries", () => {
    expect(DEFAULT_LOCALE).toBe("zh");
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(normalizeLocale("fr")).toBe("zh");

    expect(getDictionary("zh").nav.generate).toBe("生成");
    expect(getDictionary("en").nav.generate).toBe("Generate");
  });

  it("localizes option labels without changing English prompt fragments", () => {
    expect(IMAGE_TYPES.poster.label.zh).toBe("海报");
    expect(IMAGE_TYPES.poster.label.en).toBe("Poster");
    expect(IMAGE_TYPES.poster.prompt).toBe("poster");
  });

  it("keeps the final prompt template in English while preserving user input", () => {
    const prompt = compilePrompt({
      imageType: "poster",
      aspectRatio: "4:5",
      style: "editorial",
      scene: "studio",
      whitespace: "top_text_space",
      subject: "咖啡品牌发布海报",
      extraRequirements: "暖色灯光，避免可读文字"
    });

    expect(prompt).toContain("Create a poster about 咖啡品牌发布海报");
    expect(prompt).toContain("editorial magazine-inspired visual style");
    expect(prompt).toContain("Additional requirements: 暖色灯光，避免可读文字.");
    expect(prompt).toContain("Avoid text artifacts, watermarks");
  });
});
