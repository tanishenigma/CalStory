import type { UserCredential, User, Unsubscribe } from "firebase/auth";
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
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
// Self-serve account deletion for CalStory. Two phases:
//
//   1. Delete every Firestore document under `/users/{uid}`.
//      The Firestore rules restrict reads/writes to the owning user,
//      so we run this as the user themselves (currentUser must equal
//      `uid` for the wildcard rule to allow writes).
//   2. Delete the Firebase Auth account via `currentUser.delete()`.
//
// Firebase requires a *recent* sign-in for `user.delete()` — the
// session is "fresh" for ~5 minutes after sign-in, after which the
// SDK throws `auth/requires-recent-login`. When that happens we
// re-authenticate with the same Google popup and retry once before
// bubbling the error to the caller.

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
 * Custom error class so the caller can distinguish "needs re-auth"
 * from generic failures (network, permissions, etc.) and surface a
 * tailored message / retry UI.
 */
export class DeleteAccountError extends Error {
  constructor(
    message: string,
    readonly code:
      | "requires-recent-login"
      | "no-user"
      | "reauth-cancelled"
      | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "DeleteAccountError";
  }
}

/**
 * Permanently delete the current user's account and all their
 * Firestore data, then sign them out. Resolves once the auth user
 * is gone; rejects with `DeleteAccountError` on failure.
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new DeleteAccountError(
      "You must be signed in to delete your account.",
      "no-user",
    );
  }

  // Phase 1: wipe Firestore. Best-effort — even if this throws,
  // we still try to delete the auth user so the account doesn't
  // exist in a half-deleted state.
  try {
    await deleteUserData(user.uid);
  } catch (err) {
    console.error("[auth] failed to delete Firestore user data:", err);
  }

  // Phase 2: delete the Firebase Auth user. May need a fresh
  // session — if so, pop the Google re-auth once and retry.
  try {
    await user.delete();
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "auth/requires-recent-login") {
      try {
        // Re-authenticate with the same Google provider the user
        // originally signed in with. Fall back to a generic popup
        // if the configured provider isn't available for some reason.
        const provider = googleProvider ?? new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        await user.delete();
      } catch (reauthErr: unknown) {
        const rcode = (reauthErr as { code?: string } | null)?.code;
        if (rcode === "auth/popup-closed-by-user") {
          throw new DeleteAccountError(
            "Sign-in popup was closed. Please try again to verify it's you.",
            "reauth-cancelled",
          );
        }
        throw new DeleteAccountError(
          "Could not verify your identity. Please sign out and sign in again, then retry.",
          "requires-recent-login",
        );
      }
    } else if (code === "auth/no-current-user") {
      // Race: the user was already cleared somehow — treat as success.
      return;
    } else {
      console.error("[auth] failed to delete Firebase Auth user:", err);
      throw new DeleteAccountError(
        "Something went wrong while deleting your account. Please try again.",
        "unknown",
      );
    }
  }

  // Phase 3: make sure the local session is gone too. `user.delete()`
  // doesn't automatically sign out — the in-memory user object is
  // cleared, but we fire signOut() for symmetry and to flush any
  // pending IndexedDB persistence.
  try {
    await fbSignOut(auth);
  } catch {
    // Already signed out — fine.
  }
}
