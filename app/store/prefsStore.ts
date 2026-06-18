"use client";

import { create } from "zustand";
import { LS, getUserKey, setUserKey } from "@/app/lib/storage";

export type NavbarStyle = "pill" | "floating";
export type Theme = "system" | "light" | "dark";

interface PrefsState {
  navbarStyle: NavbarStyle;
  setNavbarStyle: (s: NavbarStyle) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const DEFAULT_NAVBAR: NavbarStyle = "floating";
const DEFAULT_THEME: Theme = "system";

/** Resolve "system" to the actual OS preference at call time. */
export function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return t;
}

/** Write the resolved theme to the blocking-script key so it survives refresh. */
function syncBlockingKey(t: Theme): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", resolveTheme(t));
}

export const usePrefsStore = create<PrefsState>((set) => ({
  navbarStyle: DEFAULT_NAVBAR,
  setNavbarStyle: (s) => {
    set({ navbarStyle: s });
    LS.set<NavbarStyle>("ft_navbar_style", s);
  },
  theme: DEFAULT_THEME,
  setTheme: (t) => {
    set({ theme: t });
    LS.set<Theme>("ft_theme", t);
    syncBlockingKey(t);
  },
}));

export function hydratePrefs(uid?: string | null): void {
  const fromUserNav = uid ? getUserKey<NavbarStyle>(uid, "navbar_style") : null;
  const fromGuestNav = LS.get<NavbarStyle>("ft_navbar_style", null);
  const valueNav = fromUserNav ?? fromGuestNav ?? DEFAULT_NAVBAR;

  const fromUserTheme = uid ? getUserKey<Theme>(uid, "theme") : null;
  const fromGuestTheme = LS.get<Theme>("ft_theme", null);
  const valueTheme = fromUserTheme ?? fromGuestTheme ?? DEFAULT_THEME;

  usePrefsStore.setState({ navbarStyle: valueNav, theme: valueTheme });
}

export function persistPrefsForUser(uid: string): void {
  const state = usePrefsStore.getState();
  setUserKey<NavbarStyle>(uid, "navbar_style", state.navbarStyle);
  setUserKey<Theme>(uid, "theme", state.theme);
  syncBlockingKey(state.theme);
}
