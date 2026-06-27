"use client";

import { create } from "zustand";
import { LS, LS_KEYS, getUserKey, setUserKey } from "@/app/lib/storage";

export type NavbarStyle = "pill" | "floating";
export type Theme = "system" | "light" | "dark";

interface PrefsState {
  navbarStyle: NavbarStyle;
  setNavbarStyle: (s: NavbarStyle) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  dynamicBackground: boolean;
  setDynamicBackground: (v: boolean) => void;
}

const DEFAULT_NAVBAR: NavbarStyle = "floating";
const DEFAULT_THEME: Theme = "light";
const DEFAULT_DYNAMIC_BG = false;

export function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return t;
}

function syncBlockingKey(t: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", resolveTheme(t));
}

export const usePrefsStore = create<PrefsState>((set) => ({
  navbarStyle: DEFAULT_NAVBAR,
  setNavbarStyle: (s) => {
    set({ navbarStyle: s });
    LS.set<NavbarStyle>(LS_KEYS.NAVBAR_STYLE, s);
  },
  theme: DEFAULT_THEME,
  setTheme: (t) => {
    set({ theme: t });
    LS.set<Theme>(LS_KEYS.THEME, t);
    syncBlockingKey(t);
  },
  dynamicBackground: DEFAULT_DYNAMIC_BG,
  setDynamicBackground: (v) => {
    set({ dynamicBackground: v });
    LS.set<boolean>(LS_KEYS.DYNAMIC_BG, v);
  },
}));

export function hydratePrefs(uid?: string | null): void {
  const fromUserNav = uid ? getUserKey<NavbarStyle>(uid, "navbar_style") : null;
  const fromGuestNav = LS.get<NavbarStyle>(LS_KEYS.NAVBAR_STYLE, null);
  const valueNav = fromUserNav ?? fromGuestNav ?? DEFAULT_NAVBAR;

  const fromUserTheme = uid ? getUserKey<Theme>(uid, "theme") : null;
  const fromGuestTheme = LS.get<Theme>(LS_KEYS.THEME, null);
  const valueTheme = fromUserTheme ?? fromGuestTheme ?? DEFAULT_THEME;

  const fromUserDynBg = uid ? getUserKey<boolean>(uid, "dynamic_bg") : null;
  const fromGuestDynBg = LS.get<boolean>(LS_KEYS.DYNAMIC_BG, null);
  const valueDynBg = fromUserDynBg ?? fromGuestDynBg ?? DEFAULT_DYNAMIC_BG;

  usePrefsStore.setState({
    navbarStyle: valueNav,
    theme: valueTheme,
    dynamicBackground: valueDynBg,
  });
}

export function persistPrefsForUser(uid: string): void {
  const state = usePrefsStore.getState();
  setUserKey<NavbarStyle>(uid, "navbar_style", state.navbarStyle);
  setUserKey<Theme>(uid, "theme", state.theme);
  setUserKey<boolean>(uid, "dynamic_bg", state.dynamicBackground);
  syncBlockingKey(state.theme);
}
