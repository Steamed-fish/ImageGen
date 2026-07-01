export function CreditBadge({
  credits,
  label
}: {
  credits: number | null;
  label: string;
}) {
  if (credits === null) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 whitespace-nowrap rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-moss sm:px-3 sm:text-sm">
      {credits} {label}
    </span>
  );
}
