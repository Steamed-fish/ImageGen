import Image from "next/image";
import type { Dictionary } from "@/lib/i18n/config";

type ResultPanelProps = {
  imageUrl: string | null;
  error: string | null;
  isLoading: boolean;
  labels: Dictionary["result"];
};

export function ResultPanel({
  imageUrl,
  error,
  isLoading,
  labels
}: ResultPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
      <div className="relative mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-canvas">
        {isLoading ? (
          <p className="text-sm text-muted">{labels.loading}</p>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={labels.alt}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <p className="px-6 text-center text-sm text-muted">
            {labels.empty}
          </p>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
    </section>
  );
}
