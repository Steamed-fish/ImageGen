import { describe, expect, it } from "vitest";
import { compilePrompt } from "@/lib/generation/prompt";

describe("compilePrompt", () => {
  it("creates a professional English image prompt from structured inputs", () => {
    const prompt = compilePrompt({
      imageType: "poster",
      aspectRatio: "4:5",
      style: "editorial",
      scene: "urban",
      whitespace: "top_text_space",
      subject: "a new coffee subscription brand",
      extraRequirements: "Use warm lighting and avoid readable text."
    });

    expect(prompt).toContain("Create a poster about a new coffee subscription brand");
    expect(prompt).toContain("editorial magazine-inspired visual style");
    expect(prompt).toContain("urban environment");
    expect(prompt).toContain("vertical 4:5 composition");
    expect(prompt).toContain("Reserve clean negative space near the top");
    expect(prompt).toContain("Additional requirements: Use warm lighting and avoid readable text.");
    expect(prompt).toContain("Avoid text artifacts, watermarks");
  });

  it("omits the additional requirements sentence when extra requirements are blank", () => {
    const prompt = compilePrompt({
      imageType: "avatar",
      aspectRatio: "1:1",
      style: "minimal",
      scene: "abstract",
      whitespace: "none",
      subject: "a calm productivity coach",
      extraRequirements: ""
    });

    expect(prompt).toContain("Create an avatar about a calm productivity coach");
    expect(prompt).not.toContain("Additional requirements:");
  });
});
