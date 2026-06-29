import Link from "next/link";
import {
  Archive,
  ArrowRight,
  History,
  Layers3,
  SlidersHorizontal,
  WandSparkles
} from "lucide-react";

const previewRows = [
  ["Type", "Poster"],
  ["Ratio", "4:5"],
  ["Style", "Editorial"],
  ["Scene", "Studio"],
  ["Whitespace", "Top text space"]
];

const features = [
  {
    title: "Structured choices",
    description: "Select the creative constraints that matter before a prompt is written.",
    Icon: SlidersHorizontal
  },
  {
    title: "Prompt assembly",
    description: "Turn those choices into one professional GPT Image prompt.",
    Icon: WandSparkles
  },
  {
    title: "Saved history",
    description: "Return to previous generations and reuse the direction that worked.",
    Icon: Archive
  }
];

export default function HomePage() {
  return (
    <main className="bg-canvas text-ink">
      <section className="mx-auto grid max-w-6xl items-center gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:py-16">
        <div>
          <p className="inline-flex rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-moss sm:text-sm">
            Prompt Studio
          </p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:mt-6 sm:text-4xl">
            Structured image generation for polished creative work.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:mt-6 sm:text-lg sm:leading-8">
            Choose image type, ratio, style, scene, and whitespace. Prompt
            Studio assembles a professional GPT Image prompt and saves every
            generation to your history.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-night sm:px-5 sm:py-3"
            >
              Start generating
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-moss hover:text-moss sm:px-5 sm:py-3"
            >
              <History aria-hidden="true" className="h-4 w-4" />
              View history
            </Link>
          </div>
        </div>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft sm:p-5">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-moss">Generator preview</p>
              <h2 className="mt-2 text-xl font-semibold text-ink sm:text-2xl">
                Campaign poster setup
              </h2>
            </div>
            <span className="rounded-md bg-canvas p-2 text-accent">
              <Layers3 aria-hidden="true" className="h-5 w-5" />
            </span>
          </div>

          <dl className="mt-4 divide-y divide-line border-y border-line sm:mt-5">
            {previewRows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(90px,0.45fr)_1fr] gap-3 py-2.5 text-sm sm:gap-4 sm:py-3"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 sm:mt-5">
            <p className="text-sm font-semibold text-ink">Compiled prompt</p>
            <p className="mt-2 rounded-md bg-night p-3 text-sm leading-6 text-white sm:p-4">
              Professional GPT Image prompt: Create a 4:5 editorial poster in a
              clean studio scene, leaving calm top text space for campaign copy
              and polished product lighting.
            </p>
          </div>
        </section>
      </section>

      <section className="bg-night px-6 py-9 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {features.map(({ title, description, Icon }, index) => (
            <article
              key={title}
              className="border-t border-white/15 pt-5 md:border-l md:border-t-0 md:pl-6"
            >
              <span
                className={`inline-flex rounded-md p-2 ${
                  index === 1 ? "bg-accent text-white" : "bg-canvas text-ink"
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
