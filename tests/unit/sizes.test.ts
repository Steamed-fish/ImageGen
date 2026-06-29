import { describe, expect, it } from "vitest";
import { getImageSizeForAspectRatio } from "@/lib/generation/sizes";

describe("getImageSizeForAspectRatio", () => {
  it.each([
    ["1:1", "1024x1024"],
    ["4:5", "1024x1280"],
    ["16:9", "1536x864"],
    ["9:16", "864x1536"],
    ["3:2", "1536x1024"]
  ] as const)("maps %s to %s", (ratio, expected) => {
    expect(getImageSizeForAspectRatio(ratio)).toBe(expected);
  });
});
