import { describe, expect, it } from "vitest";
import { generationRequestSchema } from "@/lib/generation/validation";

describe("generationRequestSchema", () => {
  it("accepts valid structured generation input", () => {
    const parsed = generationRequestSchema.parse({
      imageType: "poster",
      aspectRatio: "1:1",
      style: "photorealistic",
      scene: "studio",
      whitespace: "none",
      subject: "a ceramic tea set",
      extraRequirements: "Soft shadows"
    });

    expect(parsed.subject).toBe("a ceramic tea set");
  });

  it("rejects unsupported options", () => {
    expect(() =>
      generationRequestSchema.parse({
        imageType: "unsupported",
        aspectRatio: "1:1",
        style: "photorealistic",
        scene: "studio",
        whitespace: "none",
        subject: "a ceramic tea set",
        extraRequirements: ""
      })
    ).toThrow();
  });

  it("requires a non-empty subject", () => {
    expect(() =>
      generationRequestSchema.parse({
        imageType: "poster",
        aspectRatio: "1:1",
        style: "photorealistic",
        scene: "studio",
        whitespace: "none",
        subject: " ",
        extraRequirements: ""
      })
    ).toThrow();
  });
});
