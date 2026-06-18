'use client';

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthChange } from '@/app/lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
}

// Module-level flag — survives React re-renders and hot reloads.
// The Firebase onAuthChange listener is established once and never torn down.
let _listenerStarted = false;

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  loading: true,
}));

/**
 * Call this once at the app root. Safe to call multiple times — the actual
 * Firebase listener is only attached once per page lifetime.
 */
export function initAuthListener(): void {
  if (_listenerStarted) return;
  _listenerStarted = true;
  onAuthChange((user) => {
    useAuthStore.setState({ user, loading: false });
  });
}
