"use client";

import { create } from "zustand";
import { getUserKey, setUserKey } from "@/app/lib/storage";
import type { User } from "firebase/auth";

interface ProfileState {
  uid: string | null;
  hasProfile: boolean;
  hydrated: boolean;
  /** Set the active uid and seed `hasProfile` from the localStorage cache. */
  setUser: (uid: string | null, cachedHasProfile: boolean) => void;
  /** Reflect the live Firestore value (and persist it for next time). */
  setLive: (hasProfile: boolean) => void;
  /** Clear the active uid — used on sign-out. */
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  uid: null,
  hasProfile: false,
  hydrated: false,
  setUser: (uid, cachedHasProfile) => {
    // Hard reset on user change so a stale `hasProfile` from one
    // account can never leak into another account's CTA / nav.
    set({
      uid,
      hasProfile: cachedHasProfile,
      hydrated: false,
    });
  },
  setLive: (hasProfile) => {
    const { uid } = get();
    if (!uid) return;
    set({ hasProfile, hydrated: true });
    setUserKey(uid, "has_profile", hasProfile);
  },
  clear: () => set({ uid: null, hasProfile: false, hydrated: false }),
}));

export function getCachedHasProfile(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return getUserKey<boolean>(uid, "has_profile") === true;
}

/**
 * Sync the active Firebase user into the profile store, using the
 * localStorage cache as a seed. Called from the same listener that
 * drives `useAuthStore` so the two stores stay in lockstep — the
 * profile store updates in the same tick `user` does, with no extra
 * `loading`-gate delay.
 */
export function syncProfileUserFromAuth(user: User | null): void {
  const uid = user?.uid ?? null;
  if (uid) {
    useProfileStore.getState().setUser(uid, getCachedHasProfile(uid));
  } else {
    useProfileStore.getState().clear();
  }
}
