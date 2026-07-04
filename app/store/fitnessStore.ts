"use client";

/**
 * fitnessStore.ts — Zustand store for Google Fit sync status.
 *
 * Holds ephemeral UI state (loading, error) only.
 * Fitness data itself lives in AppContext (→ Firestore).
 */

import { create } from "zustand";

export type FitSyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "error"
  | "permission_denied"
  | "revoked"
  | "unsupported"
  | "no_client_id";

interface FitnessStoreState {
  status: FitSyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  setStatus: (s: FitSyncStatus) => void;
  setLastSyncedAt: (ts: number) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useFitnessStore = create<FitnessStoreState>((set) => ({
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
  setStatus: (status) => set({ status }),
  setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
  setError: (errorMessage) => set({ errorMessage }),
  reset: () => set({ status: "idle", errorMessage: null }),
}));
