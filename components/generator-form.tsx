"use client";

import {
  ImagePlus,
  LayoutTemplate,
  Loader2,
  SlidersHorizontal,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { PromptPreview } from "@/components/prompt-preview";
import { ResultPanel } from "@/components/result-panel";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select as UiSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const router = useRouter();
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
      router.refresh();
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
      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-white p-5">
            <Badge variant="accent">
              <SlidersHorizontal aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
              {locale === "zh" ? "创作控制台" : "Studio controls"}
            </Badge>
            <h1 className="mt-4 text-2xl font-semibold text-ink">
              {dictionary.generator.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {locale === "zh"
                ? "选择创意约束后，系统会自动组装专业英文 prompt。"
                : "Choose the creative constraints and let the system assemble the English prompt."}
            </p>
          </div>

          <section className="grid gap-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <OptionSelect
                icon={<LayoutTemplate aria-hidden="true" className="h-4 w-4" />}
                label={dictionary.generator.fields.imageType}
                locale={locale}
                value={input.imageType}
                options={IMAGE_TYPES}
                onChange={(value) =>
                  update("imageType", value as GenerationInput["imageType"])
                }
              />
              <OptionSelect
                icon={<ImagePlus aria-hidden="true" className="h-4 w-4" />}
                label={dictionary.generator.fields.aspectRatio}
                locale={locale}
                value={input.aspectRatio}
                options={ASPECT_RATIOS}
                onChange={(value) =>
                  update("aspectRatio", value as GenerationInput["aspectRatio"])
                }
              />
              <OptionSelect
                icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
                label={dictionary.generator.fields.style}
                locale={locale}
                value={input.style}
                options={VISUAL_STYLES}
                onChange={(value) =>
                  update("style", value as GenerationInput["style"])
                }
              />
              <OptionSelect
                icon={<WandSparkles aria-hidden="true" className="h-4 w-4" />}
                label={dictionary.generator.fields.scene}
                locale={locale}
                value={input.scene}
                options={SCENES}
                onChange={(value) =>
                  update("scene", value as GenerationInput["scene"])
                }
              />
              <div className="sm:col-span-2 xl:col-span-1">
                <OptionSelect
                  icon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}
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

            <label className="block text-sm font-semibold text-ink">
              {dictionary.generator.fields.subject}
              <Input
                value={input.subject}
                onChange={(event) => update("subject", event.target.value)}
                maxLength={180}
                className="mt-2"
                placeholder={dictionary.generator.placeholders.subject}
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              {dictionary.generator.fields.extraRequirements}
              <Textarea
                value={input.extraRequirements}
                onChange={(event) =>
                  update("extraRequirements", event.target.value)
                }
                maxLength={500}
                className="mt-2"
                placeholder={dictionary.generator.placeholders.extraRequirements}
              />
            </label>
            <Button
              type="button"
              onClick={submit}
              disabled={isLoading || !input.subject.trim()}
              size="lg"
              variant="accent"
              className="w-full"
            >
              {isLoading ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles aria-hidden="true" className="h-4 w-4" />
              )}
              {dictionary.generator.submit}
            </Button>
          </section>
        </Card>

        <div className="grid gap-5">
          <PromptPreview prompt={prompt} labels={dictionary.promptPreview} />
          <ResultPanel
            imageUrl={imageUrl}
            error={error}
            isLoading={isLoading}
            labels={dictionary.result}
          />
        </div>
      </div>
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        labels={dictionary.authDialog}
        authLabels={dictionary.login}
      />
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

function OptionSelect({
  icon,
  label,
  locale,
  value,
  options,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  locale: Locale;
  value: string;
  options: Record<string, { label: Record<Locale, string> }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      <span className="flex items-center gap-2">
        <span className="text-moss">{icon}</span>
        {label}
      </span>
      <UiSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      >
        {Object.entries(options).map(([key, option]) => (
          <option key={key} value={key}>
            {option.label[locale]}
          </option>
        ))}
      </UiSelect>
    </label>
  );
}
