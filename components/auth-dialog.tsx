"use client";

import { AuthForm } from "@/components/auth-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import type { Dictionary } from "@/lib/i18n/config";

export function AuthDialog({
  open,
  onClose,
  labels,
  authLabels
}: {
  open: boolean;
  onClose: () => void;
  labels: Dictionary["authDialog"];
  authLabels: Dictionary["login"];
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-xl font-semibold text-ink">
          {labels.title}
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-6 text-muted">
          {labels.description}
        </DialogDescription>
        <div className="mt-5">
          <AuthForm labels={authLabels} next="/generate" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
