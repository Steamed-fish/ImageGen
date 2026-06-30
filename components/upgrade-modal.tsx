"use client";

import type { Dictionary } from "@/lib/i18n/config";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onJoinWaitlist: () => Promise<void>;
  joined: boolean;
  isJoiningWaitlist: boolean;
  labels: Dictionary["upgrade"];
};

export function UpgradeModal({
  open,
  onClose,
  onJoinWaitlist,
  joined,
  isJoiningWaitlist,
  labels
}: UpgradeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-soft"
      >
        <h2 id="upgrade-modal-title" className="text-xl font-semibold text-ink">
          {labels.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          {labels.description}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink"
          >
            {labels.close}
          </button>
          <button
            type="button"
            onClick={onJoinWaitlist}
            disabled={joined || isJoiningWaitlist}
            className="flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {joined ? labels.joined : labels.join}
          </button>
        </div>
      </div>
    </div>
  );
}
