export function CreditBadge({ credits }: { credits: number | null }) {
  if (credits === null) {
    return null;
  }

  return (
    <span className="rounded border border-line bg-white px-3 py-1 text-sm font-medium text-ink">
      {credits} credits
    </span>
  );
}
