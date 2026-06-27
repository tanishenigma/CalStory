"use client";

import { create } from "zustand";
import type { User } from "firebase/auth";
import { onAuthChange } from "@/app/lib/auth";
import { clearAuthHint, getAuthHint, setAuthHint } from "@/app/lib/storage";

interface AuthState {
  user: User | null;
  loading: boolean;
}

let _listenerStarted = false;

function readCachedHint(): { user: User | null; loading: boolean } {
  if (typeof window === "undefined") {
    return { user: null, loading: true };
  }
  const hint = getAuthHint();
  if (!hint || !hint.uid) return { user: null, loading: true };

  const AGE_MS = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - hint.cachedAt > AGE_MS) {
    clearAuthHint();
    return { user: null, loading: false };
  }

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

export function initAuthListener(): void {
  if (_listenerStarted) return;
  _listenerStarted = true;
  onAuthChange((user) => {
    syncHintToStorage(user);
    useAuthStore.setState({ user, loading: false });
  });
}

export function markAuthHintOnboarded(onboarded: boolean): void {
  if (typeof window === "undefined") return;
  const hint = getAuthHint();
  if (!hint) return;
  setAuthHint({ ...hint, onboarded });
}
