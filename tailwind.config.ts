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
        canvas: "#f7f3eb",
        ink: "#201f1c",
        muted: "#746f66",
        line: "#ddd4c6",
        accent: "#c94f37",
        moss: "#667761",
        night: "#171717"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(36, 31, 24, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
