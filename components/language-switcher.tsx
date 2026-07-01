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
      className="inline-flex shrink-0 rounded-xl border border-line bg-white p-0.5 shadow-sm"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === locale}
          onClick={() => switchLocale(option)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
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
