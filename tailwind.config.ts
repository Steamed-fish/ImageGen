import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f7fb",
        surface: "#ffffff",
        shell: "#edf2f7",
        ink: "#101419",
        muted: "#64707d",
        line: "#d9e2ec",
        accent: "#0ea5b7",
        moss: "#256f78",
        night: "#0c1117",
        cloud: "#f8fbff"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.08)",
        panel: "0 24px 80px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
