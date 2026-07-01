"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-xl font-semibold text-ink">
          {labels.title}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-6 text-muted">
          {labels.description}
        </DialogDescription>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            {labels.close}
          </Button>
          <Button
            type="button"
            onClick={onJoinWaitlist}
            disabled={joined || isJoiningWaitlist}
            className="flex-1"
          >
            {joined ? labels.joined : labels.join}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
