"use client";

import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/app/lib/auth";
import { clearAuthHint, getAuthHint, setAuthHint } from "@/app/lib/storage";

interface AuthState {
  user: User | null;
  /**
   * `loading` flips to false the moment Firebase resolves the auth state
   * OR as soon as we hand-off to the cached hint on synchronous boot.
   * In the cached-hint case we treat the user as "best-effort signed in"
   * — Firebase still has to re-validate in the background, but we don't
   * need to block the UI on that round-trip.
   */
  loading: boolean;
}

// Module-level flag — survives React re-renders and hot reloads.
// The Firebase onAuthChange listener is established once and never torn down.
let _listenerStarted = false;

/**
 * Synchronously seed the auth store from the localStorage hint. Called
 * once at module load (before any component mounts), so the very first
 * render of a guarded page already has `loading: false` and the cached
 * user — no spinner flicker, no `useEffect`-driven redirect.
 */
function readCachedHint(): { user: User | null; loading: boolean } {
  if (typeof window === "undefined") {
    // SSR — no localStorage available, fall back to the standard loading.
    return { user: null, loading: true };
  }
  const hint = getAuthHint();
  if (!hint || !hint.uid) return { user: null, loading: true };

  // Age out stale hints (30 days). Old hints are removed because
  // Firebase may have rotated signing keys, the user may have been
  // deleted server-side, etc. Better to bounce them through /auth
  // than to render a "logged in" UI with an invalid session.
  const AGE_MS = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - hint.cachedAt > AGE_MS) {
    clearAuthHint();
    return { user: null, loading: false };
  }

  // Re-hydrate a User-shaped object from the hint. The Firebase SDK
  // provides `fromJSON` for this, but it depends on internal classes
  // (UserImpl) that aren't part of the public API. We only need the
  // four fields the app reads synchronously, so we return a minimal
  // duck-typed object. Any code path that requires the real User
  // will fetch it via Firebase after the listener resolves.
  const fakeUser = {
    uid: hint.uid,
    email: hint.email,
    displayName: hint.displayName,
    photoURL: hint.photoURL,
  } as unknown as User;
  return { user: fakeUser, loading: false };
}

export const useAuthStore = create<AuthState>(() => ({
  ...readCachedHint(),
}));

/**
 * Persist / clear the localStorage hint whenever the Firebase listener
 * reports a state change. Caches the minimal fields the dashboard needs
 * to render synchronously next time the page loads.
 */
function syncHintToStorage(user: User | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    clearAuthHint();
    return;
  }
  setAuthHint({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    onboarded: false, // refreshed by AppContext after Firestore hydration
    cachedAt: Date.now(),
  });
}

/**
 * Call this once at the app root. Safe to call multiple times — the actual
 * Firebase listener is only attached once per page lifetime.
 */
export function initAuthListener(): void {
  if (_listenerStarted) return;
  _listenerStarted = true;
  onAuthChange((user) => {
    syncHintToStorage(user);
    useAuthStore.setState({ user, loading: false });
  });
}

/**
 * Called by AppContext after Firestore hydration so the auth hint can
 * carry the user's `onboarded` flag. Next refresh, guarded pages will
 * know whether to redirect to /onboarding or /dashboard synchronously,
 * without waiting for Firestore to resolve.
 */
export function markAuthHintOnboarded(onboarded: boolean): void {
  if (typeof window === "undefined") return;
  const hint = getAuthHint();
  if (!hint) return;
  setAuthHint({ ...hint, onboarded });
}
