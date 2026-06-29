import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "server-only": new URL("./tests/mocks/server-only.ts", import.meta.url).pathname,
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
