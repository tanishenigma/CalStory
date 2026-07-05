"use client";

import { create } from "zustand";

interface UiState {
  chromeHidden: boolean;
  setChromeHidden: (hidden: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  chromeHidden: false,
  setChromeHidden: (hidden) => set({ chromeHidden: hidden }),
}));
