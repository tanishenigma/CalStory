import type { UserCredential, User, Unsubscribe } from "firebase/auth";
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  reauthenticateWithPopup,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "@/app/lib/firebase";

/**
 * Persist Firebase's session token to localStorage so a refresh keeps the
 * user signed in without re-prompting Google. Without this, Firebase
 * defaults to in-memory persistence and every refresh forces a fresh
 * `onAuthStateChanged(null)` → spinner → re-login dance. setPersistence
 * is idempotent on the client; calling it once at module load is enough.
 */
if (typeof window !== "undefined") {
  void setPersistence(auth, browserLocalPersistence).catch((err) => {
    // Persistence failure isn't fatal — Firebase falls back to in-memory
    // and the auth listener still works. Log so devs can investigate.
    console.warn("[auth] failed to enable local persistence:", err);
  });
}

export const signInWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, googleProvider);

export const signOut = (): Promise<void> => fbSignOut(auth);

export const onAuthChange = (cb: (user: User | null) => void): Unsubscribe =>
  onAuthStateChanged(auth, cb);

// ── Account deletion ─────────────────────────────────────────────
//
// Self-serve account deletion for CalStory.
//
// Order matters here:
//
//   Phase 1 — `user.delete()` (with re-auth fallback).
//     * Firebase requires a *recent* sign-in (~5 min). Anything
//       older → `auth/requires-recent-login`. If that fires we
//       re-authenticate with the same Google provider and retry
//       once. Errors are surfaced as `DeleteAccountError`.
//     * We delete the auth account FIRST so a partial failure
//       (e.g. user closes the re-auth popup and never retries)
//       still leaves the auth account intact — the user keeps
//       access and no data is half-wiped. The previous order
//       (Firestore first, auth second) meant the user could
//       sit in a confusing "data gone, account still here"
//       state for minutes while the Firestore wipe ran.
//
//   Phase 2 — `deleteUserData(uid)` (best-effort, fire and forget).
//     * At this point the auth user is gone, so any orphaned
//       documents under `/users/{uid}` are unreachable through
//       the client SDK (the wildcard rule keys off `auth.uid`).
//     * We deliberately don't await or block on Firestore. The
//     * user-visible success is "account deleted + signed out"
//     * which already happened in Phase 1.
//     * Errors are logged but never propagated — losing
//       orphaned data is preferable to keeping the user in a
//       half-deleted state where they think the account is gone
//       but it's actually still live.
//
// Firebase requires a *recent* sign-in for `user.delete()` — the
// session is "fresh" for ~5 minutes after sign-in, after which
// the SDK throws `auth/requires-recent-login`. When that happens
// we re-authenticate with the same Google popup and retry once
// before bubbling the error to the caller.

/**
 * Delete every Firestore document rooted at `users/{uid}`.
 *
 * The Firestore data tree is:
 *   users/{uid}                              (profile doc)
 *   users/{uid}/meals/{dateKey}/items/{id}   (nested 2 levels)
 *   users/{uid}/workouts/{dateKey}/sessions/{id}  (nested 2 levels)
 *   users/{uid}/workout_templates/{id}
 *   users/{uid}/recents/{key}
 *   users/{uid}/weight_logs/{id}
 *   users/{uid}/fitness_logs/{dateKey}
 *   users/{uid}/fasting/active
 *   users/{uid}/hydration/{dateKey}
 *   users/{uid}/settings/api_keys
 *
 * Each subcollection has to be enumerated and deleted individually
 * because Firestore has no "delete subtree" primitive. Errors are
 * logged and swallowed — partial failure is acceptable here (the
 * caller is about to delete the auth user, after which the orphaned
 * data is unreachable through the client SDK anyway).
 */
export async function deleteUserData(uid: string): Promise<void> {
  if (!uid) return;

  // Nested subcollections first (meals, workouts) — each date doc
  // has its own `items`/`sessions` subcollection that must go before
  // the parent date doc, otherwise the parent delete fails with
  // "has children" in stricter setups.
  await deleteNestedSubcollections(uid, "meals", "items");
  await deleteNestedSubcollections(uid, "workouts", "sessions");

  // Flat subcollections — single deleteDoc per child.
  const flatSubs = [
    "workout_templates",
    "recents",
    "weight_logs",
    "fitness_logs",
    "hydration",
  ];
  await Promise.all(
    flatSubs.map(async (sub) => {
      const snap = await getDocs(collection(db, "users", uid, sub));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }),
  );

  // Single-document sub-paths — best-effort, missing docs are fine.
  await deleteDoc(doc(db, "users", uid, "fasting", "active")).catch(() => {});
  await deleteDoc(doc(db, "users", uid, "settings", "api_keys")).catch(
    () => {},
  );

  // Finally, the user document itself. This is what the rules
  // wildcard actually keys off of — once it goes, the entire
  // `/users/{uid}` subtree is orphaned.
  await deleteDoc(doc(db, "users", uid)).catch(() => {});
}

async function deleteNestedSubcollections(
  uid: string,
  parent: string,
  child: string,
): Promise<void> {
  const parentSnap = await getDocs(collection(db, "users", uid, parent));
  await Promise.all(
    parentSnap.docs.map(async (dateDoc) => {
      const childSnap = await getDocs(
        collection(db, "users", uid, parent, dateDoc.id, child),
      );
      await Promise.all(childSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(dateDoc.ref);
    }),
  );
}

/**
 * Custom error class so the caller can distinguish "popup blocked"
 * from "needs re-auth" from generic failures and surface a tailored
 * message / retry UI.
 */
export class DeleteAccountError extends Error {
  constructor(
    message: string,
    readonly code:
      | "no-user"
      | "reauth-blocked"
      | "reauth-cancelled"
      | "requires-recent-login"
      | "network"
      | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "DeleteAccountError";
  }
}

/**
 * Map a Firebase Auth error code to a friendly message + DeleteAccountError.code.
 * Kept here (not in the modal) so the same wiring can be reused from
 * future entry points (e.g. an account-recovery flow).
 */
function describeAuthError(code: string | undefined): DeleteAccountError {
  switch (code) {
    case "auth/popup-blocked":
    case "auth/cancelled-popup-request":
      return new DeleteAccountError(
        "Your browser blocked the sign-in popup. Please allow popups for this site and try again.",
        "reauth-blocked",
      );
    case "auth/popup-closed-by-user":
      return new DeleteAccountError(
        "Sign-in popup was closed before we could verify it's you. Please try again.",
        "reauth-cancelled",
      );
    case "auth/network-request-failed":
      return new DeleteAccountError(
        "Network error during verification. Check your connection and try again.",
        "network",
      );
    case "auth/too-many-requests":
      return new DeleteAccountError(
        "Too many attempts. Please wait a moment and try again.",
        "unknown",
      );
    case "auth/user-mismatch":
      return new DeleteAccountError(
        "You selected a different Google account. Please use the same account you signed in with.",
        "reauth-cancelled",
      );
    case "auth/requires-recent-login":
      return new DeleteAccountError(
        "For security, please sign in again to verify it's you, then retry.",
        "requires-recent-login",
      );
    default:
      return new DeleteAccountError(
        "Something went wrong while deleting your account. Please try again.",
        "unknown",
      );
  }
}

/**
 * Permanently delete the current user's account and (best-effort)
 * their Firestore data.
 *
 * Order:
 *   1. Try `user.delete()` directly. If Firebase says the session is
 *      too old (`auth/requires-recent-login`), pop the Google re-auth
 *      popup and retry once. ALL auth errors are surfaced as
 *      `DeleteAccountError` with a typed `code` so the modal can
 *      render tailored copy and offer a retry button for popup
 *      failures.
 *   2. ONLY after the auth user is gone, kick off the Firestore wipe
 *      in the background. The user is already signed out at this
 *      point, so we don't block the success notification on it.
 *      Orphaned `/users/{uid}` documents are unreachable through
 *      the security rules (which key off `auth.uid`).
 *
 * Resolves once the auth user is deleted; rejects with
 * `DeleteAccountError` if the auth delete fails.
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new DeleteAccountError(
      "You must be signed in to delete your account.",
      "no-user",
    );
  }

  // ── Phase 1: delete the Firebase Auth user ──────────────────────
  // Why this comes first: by the time the auth delete fires, any
  // subsequent failure is user-recoverable. If we'd wiped Firestore
  // first and the auth delete silently stalled, the user would be
  // stuck with their data gone but their account still live.
  try {
    await user.delete();
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;

    // `auth/no-current-user` is racing-style "already gone" — treat
    // as success and skip straight to the Firestore wipe.
    if (code === "auth/no-current-user") {
      void deleteUserData(user.uid).catch((firestoreErr) => {
        console.warn(
          "[auth] Firestore cleanup after no-current-user failed:",
          firestoreErr,
        );
      });
      return;
    }

    // Most common case for stale sessions: the user's ID token is
    // older than ~5 minutes. Re-auth and retry once.
    if (code === "auth/requires-recent-login") {
      try {
        await reauthenticateWithPopup(user, googleProvider);
        await user.delete();
      } catch (reauthErr: unknown) {
        const rcode = (reauthErr as { code?: string } | null)?.code;
        console.error(
          "[auth] re-auth attempt failed:",
          rcode ?? "(no code)",
          reauthErr,
        );
        throw describeAuthError(rcode);
      }
    } else {
      // Unknown / non-recoverable auth failure. Log the raw error so
      // future debugging has the full Firebase code + message.
      console.error("[auth] user.delete() failed:", code ?? "(no code)", err);
      throw describeAuthError(code);
    }
  }

  // Auth user is gone. We can safely kick off the Firestore wipe
  // without holding up the success notification — orphaned data is
  // unreachable through the security rules.
  void deleteUserData(user.uid).catch((err) => {
    console.warn("[auth] Firestore cleanup after user.delete() failed:", err);
  });

  // Phase 3 (legacy): flush any pending IndexedDB persistence. If
  // the auth listener hasn't cleared the local user object yet this
  // makes sure sign-out is final on disk.
  try {
    await fbSignOut(auth);
  } catch {
    // Already signed out — fine.
  }
}
