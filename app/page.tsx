import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  History,
  Layers3,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary, type Locale } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";

const content = {
  zh: {
    heroLabel: "Prompt Studio",
    title: "不会写 prompt，也能生成专业图片。",
    description: "选择创意参数和主题，系统自动组装英文 prompt 并保存结果。",
    primary: "开始生成",
    secondary: "查看作品库",
    previewTitle: "社媒活动图",
    promptTitle: "自动组装的英文 prompt",
    prompt:
      "Create a social media image about a calm skincare launch, set in soft studio daylight, with 4:5 composition and clean top whitespace.",
    workflowTitle: "从想法到图片，只保留关键选择。",
    workflowText:
      "不用从空白 prompt 开始。类型、比例、风格、场景和留白会被转成稳定的专业描述。",
    workflow: [
      ["选择用途", "海报、封面、产品图、头像和社媒图都可直接选择。"],
      ["补充主题", "输入主体、氛围、颜色、受众和需要避免的细节。"],
      ["生成归档", "成功生成后图片进入作品库，prompt 可复用。"]
    ],
    bento: [
      ["Prompt 不是用户负担", "把复杂表达交给系统，用户只做创意判断。"],
      ["画面比例先行", "让构图从一开始就匹配发布渠道。"],
      ["留白可控", "提前给标题、卖点和按钮保留干净区域。"],
      ["历史可复用", "看过往成片，快速复制有效方向。"]
    ],
    examplesTitle: "适合第一版产品的高频场景。",
    examples: ["活动海报", "产品氛围图", "社交媒体封面", "品牌插画"],
    finalTitle: "把 prompt 技巧藏起来，把创作结果交出来。",
    finalText: "从结构化选择开始，快速生成可保存、可复用的图片资产。"
  },
  en: {
    heroLabel: "Prompt Studio",
    title: "Professional images without prompt craft.",
    description:
      "Choose creative constraints and a subject. The system writes the prompt and saves the result.",
    primary: "Start generating",
    secondary: "View library",
    previewTitle: "Social launch image",
    promptTitle: "Compiled English prompt",
    prompt:
      "Create a social media image about a calm skincare launch, set in soft studio daylight, with 4:5 composition and clean top whitespace.",
    workflowTitle: "From idea to image, with only the useful choices.",
    workflowText:
      "Start with type, ratio, style, scene, and whitespace. Prompt Studio turns those choices into a reliable image brief.",
    workflow: [
      ["Choose the format", "Posters, covers, product shots, avatars, and social images are ready to use."],
      ["Add the subject", "Describe the subject, mood, colors, audience, and details to avoid."],
      ["Generate and save", "Successful images enter the library with reusable prompt context."]
    ],
    bento: [
      ["Prompting is not the job", "The system handles wording while users make creative decisions."],
      ["Composition starts early", "Ratios and spacing are chosen before the image is generated."],
      ["Whitespace is planned", "Reserve clean space for headlines, claims, and buttons."],
      ["History compounds", "Review past work and repeat directions that performed well."]
    ],
    examplesTitle: "High-frequency use cases for the first product version.",
    examples: ["Campaign poster", "Product mood shot", "Social cover", "Brand illustration"],
    finalTitle: "Hide the prompt work. Ship the creative output.",
    finalText:
      "Start with structured choices and produce reusable image assets faster."
  }
} satisfies Record<Locale, Record<string, unknown>>;

const heroImages = [
  "https://picsum.photos/seed/prompt-studio-editorial/720/920",
  "https://picsum.photos/seed/prompt-studio-product/640/820",
  "https://picsum.photos/seed/prompt-studio-campaign/680/860"
];

export default async function HomePage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const copy = content[locale] as (typeof content)["zh"];

  return (
    <main className="overflow-hidden text-ink">
      <section className="relative mx-auto grid min-h-[calc(100dvh-76px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:py-10">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="accent">{copy.heroLabel}</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            {copy.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/generate">
                {copy.primary}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/history">
                <History aria-hidden="true" className="h-4 w-4" />
                {copy.secondary}
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[620px]">
          <div className="absolute right-2 top-4 h-[72%] w-[48%] overflow-hidden rounded-2xl border border-white/70 bg-cover bg-center shadow-panel"
            style={{ backgroundImage: `url(${heroImages[0]})` }}
          />
          <div
            className="absolute left-4 top-16 h-[58%] w-[44%] overflow-hidden rounded-2xl border border-white/70 bg-cover bg-center shadow-panel"
            style={{ backgroundImage: `url(${heroImages[1]})` }}
          />
          <Card className="absolute bottom-8 left-0 right-6 overflow-hidden bg-white/90 p-0 backdrop-blur">
            <div className="grid gap-0 md:grid-cols-[0.85fr_1fr]">
              <div
                className="min-h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImages[2]})` }}
              />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-moss">
                      {copy.previewTitle}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-ink">
                      {copy.promptTitle}
                    </h2>
                  </div>
                  <span className="rounded-xl bg-accent/10 p-3 text-moss">
                    <Layers3 aria-hidden="true" className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 rounded-xl bg-night p-4 text-sm leading-6 text-white">
                  {copy.prompt}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-night p-6 text-white sm:p-8">
          <WandSparkles aria-hidden="true" className="h-7 w-7 text-accent" />
          <h2 className="mt-6 max-w-lg text-3xl font-semibold leading-tight sm:text-4xl">
            {copy.workflowTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            {copy.workflowText}
          </p>
        </Card>
        <div className="grid gap-4">
          {copy.workflow.map(([title, text], index) => (
            <article
              key={title}
              className="rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-panel"
            >
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-moss">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-4 lg:grid-rows-[minmax(180px,1fr)_minmax(180px,1fr)]">
          {copy.bento.map(([title, text], index) => (
            <article
              key={title}
              className={`rounded-2xl border border-line p-6 shadow-soft ${
                index === 0
                  ? "bg-white lg:col-span-2"
                  : index === 1
                    ? "bg-accent text-white lg:row-span-2"
                    : index === 2
                      ? "bg-night text-white"
                      : "bg-white lg:col-span-2"
              }`}
            >
              <Sparkles
                aria-hidden="true"
                className={`h-5 w-5 ${
                  index === 1 || index === 2 ? "text-white" : "text-moss"
                }`}
              />
              <h2 className="mt-5 text-xl font-semibold">
                {title}
              </h2>
              <p
                className={`mt-3 text-sm leading-6 ${
                  index === 1 || index === 2 ? "text-white/75" : "text-muted"
                }`}
              >
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">
            {copy.examplesTitle}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.examples.map((label, index) => (
            <article
              key={label}
              className="group min-h-72 overflow-hidden rounded-2xl border border-white/80 bg-cover bg-center shadow-soft"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(12,17,23,0.05), rgba(12,17,23,0.76)), url(https://picsum.photos/seed/prompt-studio-example-${index}/520/720)`
              }}
            >
              <div className="flex h-full min-h-72 items-end p-5">
                <div className="rounded-xl bg-white/92 px-4 py-3 shadow-soft backdrop-blur">
                  <p className="font-semibold text-ink">{label}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Card className="grid gap-6 overflow-hidden bg-night p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              <span className="text-sm font-semibold">Prompt Studio</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold sm:text-4xl">
              {copy.finalTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              {copy.finalText}
            </p>
          </div>
          <Button asChild size="lg" variant="accent">
            <Link href="/generate">
              {dictionary.home.primaryCta}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </main>
  );
}
