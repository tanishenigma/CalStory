"use client";

import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/app/lib/auth";
import { syncProfileUserFromAuth } from "@/app/store/profileStore";

interface AuthState {
  user: User | null;
  loading: boolean;
}

let _listenerStarted = false;

/**
 * Auth store.
 *
 * The `loading` flag is true from app boot until the Firebase
 * `onAuthStateChanged` listener (started once via `initAuthListener`)
 * fires. While loading, pages render a skeleton via `useAuthGuard`.
 *
 * We do NOT cache the signed-in user in localStorage. Firebase's JS
 * SDK already persists the auth session via IndexedDB under
 * `browserLocalPersistence` (see app/lib/auth.ts), so on a hard
 * refresh `onAuthStateChanged` resolves synchronously from IndexedDB
 * and we get the same boot speed without storing `uid` / `email` /
 * `displayName` / `photoURL` in localStorage.
 */
export const useAuthStore = create<AuthState>(() => ({
  user: null,
  loading: true,
}));

export function initAuthListener(): void {
  if (_listenerStarted) return;
  _listenerStarted = true;
  onAuthChange((user) => {
    useAuthStore.setState({ user, loading: false });
    // Mirror the same user into the profile store in the same tick so
    // consumers (CTA, Navbar) update with no `loading`-gate delay.
    syncProfileUserFromAuth(user);
  });
}
