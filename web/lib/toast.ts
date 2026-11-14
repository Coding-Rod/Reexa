"use client";
import { toast } from "sonner";

/** Destructive confirmation as a toast (no browser confirm()). Runs `action`, then shows `done`. */
export function confirmToast(message: string, labels: { confirm: string; cancel: string }, action: () => void, done: string) {
  toast(message, {
    duration: 10_000,
    action: { label: labels.confirm, onClick: () => { action(); toast.success(done); } },
    cancel: { label: labels.cancel, onClick: () => {} },
  });
}
