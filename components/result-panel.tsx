import Image from "next/image";
import { AlertCircle, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  const isChinese = labels.title === "结果";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {isLoading ? labels.loading : imageUrl ? labels.alt : labels.empty}
          </p>
        </div>
        <Badge variant={imageUrl ? "accent" : "outline"}>
          <Sparkles aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
          {imageUrl
            ? isChinese
              ? "已生成"
              : "Ready"
            : isChinese
              ? "画布"
              : "Canvas"}
        </Badge>
      </div>
      <div className="p-5 sm:p-6">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-cloud">
          {isLoading ? (
            <div className="w-full p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-moss">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                {labels.loading}
              </div>
              <Skeleton className="mt-6 aspect-square w-full rounded-2xl" />
              <div className="mt-5 grid gap-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={labels.alt}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="max-w-xs px-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-moss">
                <ImagePlus aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm leading-6 text-muted">{labels.empty}</p>
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
