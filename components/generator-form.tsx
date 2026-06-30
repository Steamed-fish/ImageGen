"use client";

import { useMemo, useRef, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { PromptPreview } from "@/components/prompt-preview";
import { ResultPanel } from "@/components/result-panel";
import { UpgradeModal } from "@/components/upgrade-modal";
import {
  ASPECT_RATIOS,
  DEFAULT_GENERATION_INPUT,
  IMAGE_TYPES,
  SCENES,
  VISUAL_STYLES,
  WHITESPACE
} from "@/lib/generation/options";
import { compilePrompt } from "@/lib/generation/prompt";
import type { Dictionary, Locale } from "@/lib/i18n/config";
import type { GenerationInput } from "@/lib/types";

type GeneratorFormProps = {
  isLoggedIn: boolean;
  locale: Locale;
  dictionary: Dictionary;
};

type GenerateResponse =
  | { imageUrl: string }
  | { error: string; code?: string };

export function GeneratorForm({
  isLoggedIn,
  locale,
  dictionary
}: GeneratorFormProps) {
  const [input, setInput] = useState<GenerationInput>(DEFAULT_GENERATION_INPUT);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const isJoiningWaitlistRef = useRef(false);

  const prompt = useMemo(() => {
    if (!input.subject.trim()) {
      return dictionary.generator.emptyPrompt;
    }

    return compilePrompt(input);
  }, [dictionary.generator.emptyPrompt, input]);

  function errorMessageFor(payload: Extract<GenerateResponse, { error: string }>) {
    if (
      payload.code &&
      Object.prototype.hasOwnProperty.call(dictionary.apiErrors, payload.code)
    ) {
      return dictionary.apiErrors[
        payload.code as keyof Dictionary["apiErrors"]
      ];
    }

    return payload.error || dictionary.generator.fallbackError;
  }

  function update<K extends keyof GenerationInput>(
    key: K,
    value: GenerationInput[K]
  ) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);

    if (!isLoggedIn) {
      setError(dictionary.generator.signInRequired);
      setAuthOpen(true);
      return;
    }

    setIsLoading(true);
    setImageUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || "error" in payload) {
        if ("code" in payload && payload.code === "INSUFFICIENT_CREDITS") {
          setUpgradeOpen(true);
        }
        setError(
          "error" in payload
            ? errorMessageFor(payload)
            : dictionary.generator.fallbackError
        );
        return;
      }

      setImageUrl(payload.imageUrl);
    } catch {
      setError(dictionary.generator.genericError);
    } finally {
      setIsLoading(false);
    }
  }

  async function joinWaitlist() {
    if (joined || isJoiningWaitlistRef.current) {
      return;
    }

    isJoiningWaitlistRef.current = true;
    setIsJoiningWaitlist(true);

    try {
      const response = await fetch("/api/upgrade-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "insufficient_credits_modal" })
      });

      if (response.ok) {
        setJoined(true);
      }
    } finally {
      isJoiningWaitlistRef.current = false;
      setIsJoiningWaitlist(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-lg border border-line bg-white p-5">
          <h1 className="text-2xl font-semibold text-ink">
            {dictionary.generator.title}
          </h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select
              label={dictionary.generator.fields.imageType}
              locale={locale}
              value={input.imageType}
              options={IMAGE_TYPES}
              onChange={(value) =>
                update("imageType", value as GenerationInput["imageType"])
              }
            />
            <Select
              label={dictionary.generator.fields.aspectRatio}
              locale={locale}
              value={input.aspectRatio}
              options={ASPECT_RATIOS}
              onChange={(value) =>
                update("aspectRatio", value as GenerationInput["aspectRatio"])
              }
            />
            <Select
              label={dictionary.generator.fields.style}
              locale={locale}
              value={input.style}
              options={VISUAL_STYLES}
              onChange={(value) =>
                update("style", value as GenerationInput["style"])
              }
            />
            <Select
              label={dictionary.generator.fields.scene}
              locale={locale}
              value={input.scene}
              options={SCENES}
              onChange={(value) =>
                update("scene", value as GenerationInput["scene"])
              }
            />
            <div className="sm:col-span-2">
              <Select
                label={dictionary.generator.fields.whitespace}
                locale={locale}
                value={input.whitespace}
                options={WHITESPACE}
                onChange={(value) =>
                  update("whitespace", value as GenerationInput["whitespace"])
                }
              />
            </div>
          </div>
          <label className="mt-5 block text-sm font-medium text-ink">
            {dictionary.generator.fields.subject}
            <input
              value={input.subject}
              onChange={(event) => update("subject", event.target.value)}
              maxLength={180}
              className="mt-2 w-full rounded-md border border-line px-3 py-2"
              placeholder={dictionary.generator.placeholders.subject}
            />
          </label>
          <label className="mt-5 block text-sm font-medium text-ink">
            {dictionary.generator.fields.extraRequirements}
            <textarea
              value={input.extraRequirements}
              onChange={(event) =>
                update("extraRequirements", event.target.value)
              }
              maxLength={500}
              className="mt-2 min-h-28 w-full rounded-md border border-line px-3 py-2"
              placeholder={dictionary.generator.placeholders.extraRequirements}
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading || !input.subject.trim()}
            className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {dictionary.generator.submit}
          </button>
        </section>
        <div className="grid gap-6">
          <PromptPreview prompt={prompt} labels={dictionary.promptPreview} />
          <ResultPanel
            imageUrl={imageUrl}
            error={error}
            isLoading={isLoading}
            labels={dictionary.result}
          />
        </div>
      </div>
      <AuthDialog open={authOpen} labels={dictionary.authDialog} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onJoinWaitlist={joinWaitlist}
        joined={joined}
        isJoiningWaitlist={isJoiningWaitlist}
        labels={dictionary.upgrade}
      />
    </>
  );
}

function Select({
  label,
  locale,
  value,
  options,
  onChange
}: {
  label: string;
  locale: Locale;
  value: string;
  options: Record<string, { label: Record<Locale, string> }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2"
      >
        {Object.entries(options).map(([key, option]) => (
          <option key={key} value={key}>
            {option.label[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
