import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthCallbackUrl,
  buildLoginPath,
  buildLoginUrl,
  cleanAuthMessage,
  getSafeRedirectPath,
  getSiteUrl
} from "@/lib/auth/redirects";

describe("auth redirect helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps local paths and rejects unsafe redirects", () => {
    expect(getSafeRedirectPath("/generate")).toBe("/generate");
    expect(getSafeRedirectPath("/history?tab=recent")).toBe(
      "/history?tab=recent"
    );
    expect(getSafeRedirectPath("https://evil.example")).toBe("/generate");
    expect(getSafeRedirectPath("//evil.example")).toBe("/generate");
    expect(getSafeRedirectPath(null)).toBe("/generate");
  });

  it("normalizes site URLs and builds callback URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://prompt.example/");

    expect(getSiteUrl()).toBe("https://prompt.example");
    expect(buildAuthCallbackUrl("/account")).toBe(
      "https://prompt.example/auth/callback?next=%2Faccount"
    );
  });

  it("builds login paths with sanitized errors", () => {
    expect(buildLoginPath("/generate", "Bad\u0000message")).toBe(
      "/login?next=%2Fgenerate&error=Bad+message"
    );
    expect(buildLoginPath("https://evil.example")).toBe(
      "/login?next=%2Fgenerate"
    );
  });

  it("builds login URLs against the request origin", () => {
    const url = buildLoginUrl(
      "https://app.example",
      "/history",
      "Provider disabled"
    );

    expect(url.toString()).toBe(
      "https://app.example/login?next=%2Fhistory&error=Provider+disabled"
    );
  });

  it("strips control characters and caps error message length", () => {
    const message = `${"x".repeat(300)}\u0007`;

    expect(cleanAuthMessage(message)).toHaveLength(240);
    expect(cleanAuthMessage(" Invalid\nmessage\t")).toBe("Invalid message");
  });
});
