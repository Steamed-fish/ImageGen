import Image from "next/image";

type ResultPanelProps = {
  imageUrl: string | null;
  error: string | null;
  isLoading: boolean;
};

export function ResultPanel({ imageUrl, error, isLoading }: ResultPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-base font-semibold text-ink">Result</h2>
      <div className="relative mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-canvas">
        {isLoading ? (
          <p className="text-sm text-muted">Generating...</p>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt="Generated result"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <p className="px-6 text-center text-sm text-muted">
            Your generated image will appear here.
          </p>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
    </section>
  );
}
