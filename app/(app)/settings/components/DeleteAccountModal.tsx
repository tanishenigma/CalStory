"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deleteAccount, DeleteAccountError } from "@/app/lib/auth";
import { useToast } from "@/app/components/ToastContainer";
import { useUiStore } from "@/app/store/uiStore";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Confirmation dialog for permanent account deletion.
 *
 * Gates the destructive action behind a "type DELETE" step so the
 * user has to deliberately confirm — a single misclick on the
 * trigger button shouldn't be enough to wipe months of data. The
 * modal is uncontrolled except for `open`/`onClose`; the rest of
 * the form state resets every time the modal is mounted.
 *
 * While open, the modal also suppresses the app chrome (`PillNav`,
 * `BottomNav`, `FAB`) via the global `useUiStore`. That guarantees
 * the destructive confirm is the *only* thing on screen and the
 * sidebar can't sneak above the overlay. Cleanup runs on close
 * AND on unmount, so the chrome always comes back.
 */
export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const toast = useToast();
  const setChromeHidden = useUiStore((s) => s.setChromeHidden);
  const [confirmText, setConfirmText] = useState<string>("");
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // `errorCode` lets the JSX render a Retry button for popup-related
  // failures (reauth-blocked, reauth-cancelled) so the user can pop
  // the Google sign-in again without re-typing DELETE.
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset every time the modal re-opens so a stale "DELETE" string
  // from a previous attempt doesn't accidentally unlock the button.
  // Same effect also toggles the chrome-hidden flag — the cleanup
  // runs both on `open` going false AND on unmount, so the sidebar
  // always returns no matter how the modal exits.
  useEffect(() => {
    if (!open) return;
    setConfirmText("");
    setError(null);
    setErrorCode(null);
    setDeleting(false);
    setChromeHidden(true);
    // Autofocus the confirm input on open. Use rAF to wait for the
    // mount animation to start.
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      setChromeHidden(false);
    };
  }, [open, setChromeHidden]);

  if (!open) return null;

  const canSubmit = confirmText.trim() === "DELETE" && !deleting;

  async function handleDelete() {
    if (!canSubmit) return;
    setError(null);
    setErrorCode(null);
    setDeleting(true);
    try {
      await deleteAccount();
      // Auth user is gone. The auth listener will clear
      // `useAuthStore.user`; we bounce to `/` so the user lands
      // somewhere sensible without a stale session hanging around.
      toast("Account deleted");
      onClose();
      // `replace` (not `push`) so the back button doesn't bring the
      // user back into a dead auth context.
      router.replace("/");
      // Note: Firestore cleanup happens *inside* `deleteAccount()`
      // (auth-first ordering — see `app/lib/auth.ts`). Once the auth
      // user is gone, orphaned `/users/{uid}` documents are
      // unreachable through the security rules, so a partial wipe
      // is harmless.
    } catch (err) {
      const code = err instanceof DeleteAccountError ? err.code : "unknown";
      const msg =
        err instanceof DeleteAccountError
          ? err.message
          : "Something went wrong while deleting your account. Please try again.";
      setError(msg);
      setErrorCode(code);
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="delete-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => {
          // Click on backdrop closes, but only when not in-flight.
          if (e.target === e.currentTarget && !deleting) onClose();
        }}
        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
        style={{
          background: "oklch(0.2272 0.0049 173.9454 / 0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
        <motion.div
          key="delete-sheet"
          initial={{ y: 60, opacity: 0.4, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
          className="bg-card text-ink w-full sm:max-w-120 sm:rounded-2xl rounded-t-[22px] shadow-xl p-6 sm:p-7"
          style={{
            maxHeight: "92vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center">
              <AlertTriangle
                size={18}
                className="text-red-600 dark:text-red-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="delete-account-title"
                className="text-lg font-bold leading-tight">
                Delete your account?
              </h2>
              <p
                id="delete-account-desc"
                className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This will permanently delete your CalStory account and{" "}
                <strong>all</strong> of your data — profile, meals, workouts,
                weight logs, fasting sessions, hydration, and any saved API key.
                This cannot be undone.
              </p>
            </div>
          </div>

          <ul className="text-xs text-muted-foreground space-y-1 mb-5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              Your profile, daily targets and macro plan will be erased.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              Every meal, workout and weight log will be permanently removed.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              Your personal Gemini API key (if stored) will be wiped.
            </li>
          </ul>

          <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/60 mb-2">
            Type{" "}
            <span className="font-mono text-red-600 dark:text-red-400">
              DELETE
            </span>{" "}
            to confirm
          </label>
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            autoComplete="off"
            spellCheck={false}
            placeholder="DELETE"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-destructive/40 focus:border-destructive transition-colors disabled:opacity-60"
          />

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                {error}
              </p>
              {/* Retry only on popup-related failures so the user can
                  try the verification again without re-typing DELETE.
                  Other errors (network, rate-limit) aren't retryable
                  by clicking the same button — the user needs to fix
                  the underlying issue first. */}
              {(errorCode === "reauth-blocked" ||
                errorCode === "reauth-cancelled") && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="mt-2 text-xs font-semibold text-destructive hover:underline disabled:opacity-50">
                  Try again
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 size={15} />
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
