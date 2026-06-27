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
  PROFILE_USER: "ft_profile_user",
  MEALS_USER: "ft_meals_user",
  WORKOUTS_USER: "ft_workouts_user",

  AUTH_HINT: "ft_auth_hint",
} as const;

export function getUserKey<T>(uid: string, suffix: string): T | null {
  if (!uid) return null;
  return LS.get<T>(`ft_${suffix}_${uid}`);
}

export function setUserKey<T>(uid: string, suffix: string, value: T): void {
  if (!uid) return;
  LS.set<T>(`ft_${suffix}_${uid}`, value);
}

export interface AuthHint {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  onboarded: boolean;
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
