"use client";

import {
  LOCALE_COOKIE,
  LOCALES,
  type Dictionary,
  type Locale
} from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  labels: Dictionary["language"];
};

export function LanguageSwitcher({ locale, labels }: LanguageSwitcherProps) {
  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  return (
    <div
      role="group"
      aria-label={labels.label}
      className="inline-flex shrink-0 rounded-md border border-line bg-white p-0.5"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === locale}
          onClick={() => switchLocale(option)}
          className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
            option === locale
              ? "bg-ink text-white"
              : "text-muted hover:bg-canvas hover:text-ink"
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
}
