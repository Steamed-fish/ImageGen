"use client";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onJoinWaitlist: () => Promise<void>;
  joined: boolean;
};

export function UpgradeModal({
  open,
  onClose,
  onJoinWaitlist,
  joined
}: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Upgrade coming soon</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          You have used your free credits. Join the waitlist and we will let you
          know when paid plans are available.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onJoinWaitlist}
            disabled={joined}
            className="flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {joined ? "Joined" : "Join waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
