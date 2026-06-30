import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { getRequestLocale } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Studio",
  description: "Structured AI image generation with professional prompt assembly."
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
