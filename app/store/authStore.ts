'use client';

import { create } from 'zustand';
import type { User, Unsubscribe } from 'firebase/auth';
import { onAuthChange } from '@/app/lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => Unsubscribe;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initAuth: () => {
    if (get().initialized) {
      // Return a no-op unsubscribe if already initialized
      return () => {};
    }

    set({ initialized: true });
    const unsub = onAuthChange((user) => {
      set({ user, loading: false });
    });
    return unsub;
  },
}));
