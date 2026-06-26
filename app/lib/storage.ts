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
  PROFILE: "ft_profile",
  MEALS: "ft_meals",
  WORKOUTS: "ft_workouts",
  /** Per-user caches (keyed by uid) used as offline fallbacks. */
  PROFILE_USER: "ft_profile_user",
  MEALS_USER: "ft_meals_user",
  WORKOUTS_USER: "ft_workouts_user",
  /**
   * `ft_auth_hint` — minimal cached copy of the Firebase user we hydrated
   * the last time `useAuthStore` observed a signed-in user. The shape is
   * the subset of firebase.User we actually need to render the dashboard
   * before Firebase has resolved (uid, email, displayName, photoURL).
   * Plus an `onboarded` flag derived from the cached profile so guarded
   * pages can route correctly without waiting on Firestore.
   */
  AUTH_HINT: "ft_auth_hint",
} as const;

/** Get a localStorage value scoped to a specific user. */
export function getUserKey<T>(uid: string, suffix: string): T | null {
  if (!uid) return null;
  return LS.get<T>(`ft_${suffix}_${uid}`);
}

/** Set a localStorage value scoped to a specific user. */
export function setUserKey<T>(uid: string, suffix: string, value: T): void {
  if (!uid) return;
  LS.set<T>(`ft_${suffix}_${uid}`, value);
}

/* ────────────────────────────────────────────────────────────
 * Auth hint — synchronous boot from localStorage.
 *
 * Why this exists:
 *   Firebase's `onAuthStateChanged` resolves asynchronously. Without a
 *   hint, every page refresh renders <Spinner /> for a full network
 *   round-trip before the dashboard can mount. By caching the last
 *   known signed-in user on sign-in and clearing it on sign-out, we
 *   can boot the auth store synchronously and skip the spinner for
 *   returning users. Firebase still re-validates in the background
 *   (and the user is `null` until then for sensitive actions).
 * ──────────────────────────────────────────────────────────── */

/**
 * The fields we persist about the user. Firebase's `User` object has
 * ~30 fields and many of them are non-serializable (functions, dates,
 * tokens). Keeping the hint explicit prevents accidental leaks of
 * sensitive fields into localStorage.
 */
export interface AuthHint {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  /** Cached snapshot of whether the user has completed onboarding. */
  onboarded: boolean;
  /** Unix ms — used to age-out very stale hints. */
  cachedAt: number;
}

export function getAuthHint(): AuthHint | null {
  return LS.get<AuthHint>(LS_KEYS.AUTH_HINT);
}

export function setAuthHint(hint: AuthHint): void {
  LS.set<AuthHint>(LS_KEYS.AUTH_HINT, hint);
}

export function clearAuthHint(): void {
  LS.remove(LS_KEYS.AUTH_HINT);
}
