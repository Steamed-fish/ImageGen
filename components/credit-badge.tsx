export function CreditBadge({ credits }: { credits: number | null }) {
  if (credits === null) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 whitespace-nowrap rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink sm:px-3 sm:text-sm">
      {credits} credits
    </span>
  );
}
