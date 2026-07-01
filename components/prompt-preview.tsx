import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n/config";

export function PromptPreview({
  prompt,
  labels
}: {
  prompt: string;
  labels: Dictionary["promptPreview"];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
        <Badge variant="outline">{labels.badge}</Badge>
      </div>
      <div className="p-5 sm:p-6">
        <p className="min-h-36 whitespace-pre-wrap rounded-2xl border border-line bg-night p-5 text-sm leading-6 text-white shadow-inner">
          {prompt}
        </p>
      </div>
    </Card>
  );
}
