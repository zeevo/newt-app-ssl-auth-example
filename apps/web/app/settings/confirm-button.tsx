"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@newt-app-ssl-auth-example/ui/alert-dialog";
import { Button } from "@newt-app-ssl-auth-example/ui/button";

/**
 * A destructive button that asks first. `onConfirm` resolves to an error
 * message to show in the dialog, or null once it is done.
 */
export function ConfirmButton({
  label,
  pendingLabel,
  title,
  description,
  onConfirm,
}: {
  label: string;
  pendingLabel: string;
  title: string;
  description: string;
  onConfirm: () => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setPending(true);
    setError("");
    const message = await onConfirm();
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setOpen(false);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) setError("");
        setOpen(next);
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" />}>{label}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? pendingLabel : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
