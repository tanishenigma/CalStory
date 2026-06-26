import type { UserCredential, User, Unsubscribe } from "firebase/auth";
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "@/app/lib/firebase";

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
