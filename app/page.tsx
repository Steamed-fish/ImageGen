export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          Prompt Studio
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
          Generate polished images from structured creative choices.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Choose the image type, ratio, style, scene, and whitespace. Prompt
          Studio turns them into a professional image prompt and saves every
          result to your history.
        </p>
      </section>
    </main>
  );
}
