export function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-ink">Professional prompt</h2>
        <span className="text-xs uppercase text-muted">Read-only</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-md bg-canvas p-4 text-sm leading-6 text-muted">
        {prompt}
      </p>
    </section>
  );
}
