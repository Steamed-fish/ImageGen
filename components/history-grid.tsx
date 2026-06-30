import Image from "next/image";
import { IMAGE_TYPES } from "@/lib/generation/options";
import type { Dictionary, Locale } from "@/lib/i18n/config";
import type { ImageType } from "@/lib/types";

export type HistoryItem = {
  id: string;
  image_type: string;
  subject: string;
  compiled_prompt: string;
  storage_path: string | null;
  created_at: string;
  completed_at: string | null;
  imageUrl: string | null;
};

type HistoryGridProps = {
  items: HistoryItem[];
  locale: Locale;
  labels: Dictionary["history"];
};

function imageTypeLabel(imageType: string, locale: Locale) {
  if (imageType in IMAGE_TYPES) {
    return IMAGE_TYPES[imageType as ImageType].label[locale];
  }

  return imageType;
}

export function HistoryGrid({ items, locale, labels }: HistoryGridProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-line bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-ink">
          {labels.emptyTitle}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {labels.emptyDescription}
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-lg border border-line bg-white"
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-canvas">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.subject}
                fill
                unoptimized
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <p className="px-6 text-center text-sm text-muted">
                {labels.previewUnavailable}
              </p>
            )}
          </div>
          <div className="p-4">
            <p className="text-xs uppercase text-muted">
              {imageTypeLabel(item.image_type, locale)}
            </p>
            <h2 className="mt-2 line-clamp-2 text-base font-semibold text-ink">
              {item.subject}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
              {item.compiled_prompt}
            </p>
            {item.imageUrl ? (
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
              >
                {labels.openImage}
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
