import Image from "next/image";
import { ExternalLink, ImagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function HistoryGrid({ items, locale, labels }: HistoryGridProps) {
  if (items.length === 0) {
    return (
      <Card className="overflow-hidden p-8 text-center sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-moss">
          <ImagePlus aria-hidden="true" className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-ink">
          {labels.emptyTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          {labels.emptyDescription}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`group overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-panel ${
            index % 5 === 0 ? "sm:col-span-2 xl:col-span-1" : ""
          }`}
        >
          <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-cloud">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.subject}
                fill
                unoptimized
                sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <p className="px-6 text-center text-sm text-muted">
                {labels.previewUnavailable}
              </p>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="accent">
                {imageTypeLabel(item.image_type, locale)}
              </Badge>
              <span className="text-xs font-medium text-muted">
                {formatDate(item.created_at, locale)}
              </span>
            </div>
            <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-ink">
              {item.subject}
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
              {item.compiled_prompt}
            </p>
            {item.imageUrl ? (
              <Button asChild variant="outline" size="sm" className="mt-5">
                <a href={item.imageUrl} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  {labels.openImage}
                </a>
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
