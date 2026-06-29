"use client";

import { useMemo, useState } from "react";
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
import type { GenerationInput } from "@/lib/types";

type GeneratorFormProps = {
  isLoggedIn: boolean;
};

type GenerateResponse =
  | { imageUrl: string }
  | { error: string; code?: "UNAUTHENTICATED" | "INSUFFICIENT_CREDITS" };

export function GeneratorForm({ isLoggedIn }: GeneratorFormProps) {
  const [input, setInput] = useState<GenerationInput>(DEFAULT_GENERATION_INPUT);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  const prompt = useMemo(() => {
    if (!input.subject.trim()) {
      return "Enter a subject to preview the professional prompt.";
    }

    return compilePrompt(input);
  }, [input]);

  function update<K extends keyof GenerationInput>(
    key: K,
    value: GenerationInput[K]
  ) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);

    if (!isLoggedIn) {
      setError("Please sign in with Google to generate an image.");
      setAuthOpen(true);
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const payload = (await response.json()) as GenerateResponse;
    setIsLoading(false);

    if (!response.ok || "error" in payload) {
      if ("code" in payload && payload.code === "INSUFFICIENT_CREDITS") {
        setUpgradeOpen(true);
      }
      setError("error" in payload ? payload.error : "Generation failed.");
      return;
    }

    setImageUrl(payload.imageUrl);
  }

  async function joinWaitlist() {
    const response = await fetch("/api/upgrade-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "insufficient_credits_modal" })
    });

    if (response.ok) {
      setJoined(true);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-lg border border-line bg-white p-5">
          <h1 className="text-2xl font-semibold text-ink">Create an image</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select
              label="Image type"
              value={input.imageType}
              options={IMAGE_TYPES}
              onChange={(value) =>
                update("imageType", value as GenerationInput["imageType"])
              }
            />
            <Select
              label="Aspect ratio"
              value={input.aspectRatio}
              options={ASPECT_RATIOS}
              onChange={(value) =>
                update("aspectRatio", value as GenerationInput["aspectRatio"])
              }
            />
            <Select
              label="Style"
              value={input.style}
              options={VISUAL_STYLES}
              onChange={(value) =>
                update("style", value as GenerationInput["style"])
              }
            />
            <Select
              label="Scene"
              value={input.scene}
              options={SCENES}
              onChange={(value) =>
                update("scene", value as GenerationInput["scene"])
              }
            />
            <div className="sm:col-span-2">
              <Select
                label="Whitespace"
                value={input.whitespace}
                options={WHITESPACE}
                onChange={(value) =>
                  update("whitespace", value as GenerationInput["whitespace"])
                }
              />
            </div>
          </div>
          <label className="mt-5 block text-sm font-medium text-ink">
            Subject
            <input
              value={input.subject}
              onChange={(event) => update("subject", event.target.value)}
              maxLength={180}
              className="mt-2 w-full rounded-md border border-line px-3 py-2"
              placeholder="a coffee brand launch poster"
            />
          </label>
          <label className="mt-5 block text-sm font-medium text-ink">
            Additional requirements
            <textarea
              value={input.extraRequirements}
              onChange={(event) =>
                update("extraRequirements", event.target.value)
              }
              maxLength={500}
              className="mt-2 min-h-28 w-full rounded-md border border-line px-3 py-2"
              placeholder="Mood, colors, objects, audience, details to avoid"
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading || !input.subject.trim()}
            className="mt-6 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Generate 1 image
          </button>
        </section>
        <div className="grid gap-6">
          <PromptPreview prompt={prompt} />
          <ResultPanel imageUrl={imageUrl} error={error} isLoading={isLoading} />
        </div>
      </div>
      <AuthDialog open={authOpen} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onJoinWaitlist={joinWaitlist}
        joined={joined}
      />
    </>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: Record<string, { label: string }>;
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
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
