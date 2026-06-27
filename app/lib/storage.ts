/**
 * storage.ts — localStorage helpers.
 *
 * Scope: this module is intentionally tiny. It is for **UI prefs only**
 * (theme, navbar style, dynamic-background toggle) — nothing that has
 * any meaningful security or privacy implication. Profile data, auth
 * state, meals and workouts are NOT stored here. The Firebase JS SDK
 * persists its own auth session via IndexedDB (browserLocalPersistence),
 * and all domain data lives in Firestore. The auth-hint and per-user
 * profile caches that previously lived in this module were removed
 * because they duplicated Firebase's own session persistence while
 * adding a localStorage surface for PII.
 */

export const LS = {
  get<T>(key: string, defaultVal: T | null = null): T | null {
    if (typeof window === "undefined") return defaultVal;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

export const LS_KEYS = {
  // UI prefs only. Per-uid mirrors live under `ft_<pref>_<uid>` and are
  // read via getUserKey() / written via setUserKey() below.
  NAVBAR_STYLE: "ft_navbar_style",
  THEME: "ft_theme",
  DYNAMIC_BG: "ft_dynamic_bg",
} as const;

export function getUserKey<T>(uid: string, suffix: string): T | null {
  if (!uid) return null;
  return LS.get<T>(`ft_${suffix}_${uid}`);
}

export function setUserKey<T>(uid: string, suffix: string, value: T): void {
  if (!uid) return;
  LS.set<T>(`ft_${suffix}_${uid}`, value);
}
