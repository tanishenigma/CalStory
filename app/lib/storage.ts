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
};

export const LS_KEYS = {
  PROFILE: "ft_profile",
  MEALS: "ft_meals",
  WORKOUTS: "ft_workouts",
  /** Per-user caches (keyed by uid) used as offline fallbacks. */
  PROFILE_USER: "ft_profile_user",
  MEALS_USER: "ft_meals_user",
  WORKOUTS_USER: "ft_workouts_user",
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
