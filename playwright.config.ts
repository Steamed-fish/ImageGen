import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const dummySupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTUzNjAwMDB9." +
  "ZHVtbXktc2lnbmF0dXJl";
const macChromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const shouldUseLocalChrome =
  process.platform === "darwin" &&
  existsSync(macChromePath);
const browserChannel =
  process.env.PLAYWRIGHT_CHANNEL ??
  (shouldUseLocalChrome ? "chrome" : undefined);

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "output/playwright/test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    env: {
      E2E_TEST_MODE: "1",
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || dummySupabaseAnonKey
    }
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(browserChannel ? { channel: browserChannel } : {})
      }
    }
  ]
});
