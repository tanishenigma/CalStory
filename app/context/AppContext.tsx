"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { useAuthStore } from "@/app/store/authStore";
import {
  hydratePrefs,
  persistPrefsForUser,
  usePrefsStore,
} from "@/app/store/prefsStore";
import {
  saveMeal,
  deleteMealDB,
  saveWorkout,
  deleteWorkoutDB,
  saveProfile,
  getProfile,
  getMeals,
  getWorkouts,
  saveRecentMeal,
  getRecentMeals,
  saveWorkoutTemplateDB,
  getWorkoutTemplates,
  deleteWorkoutTemplateDB,
} from "@/app/lib/db";
import { LS, LS_KEYS, getUserKey } from "@/app/lib/storage";
import type {
  AppState,
  AppContextValue,
  Meal,
  Workout,
  SavedWorkout,
  Profile,
  RecentMeal,
} from "@/app/types";

export const todayKey = (): string => new Date().toISOString().slice(0, 10);
export const uid = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

type Action =
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "SET_PROFILE"; payload: Profile }
  | { type: "SET_DATE"; payload: string }
  | { type: "ADD_MEAL"; payload: Meal }
  | { type: "ADD_MEAL_RANGE"; payload: { meals: Meal[]; dayKeys: string[] } }
  | { type: "DELETE_MEAL"; id: string; day: string }
  | { type: "ADD_WORKOUT"; payload: Workout }
  | { type: "DELETE_WORKOUT"; id: string; day: string }
  | { type: "SET_RECENTS"; payload: RecentMeal[] }
  | { type: "ADD_TEMPLATE"; payload: SavedWorkout }
  | { type: "DELETE_TEMPLATE"; id: string }
  | { type: "SET_TEMPLATES"; payload: SavedWorkout[] };

const initial: AppState = {
  profile: undefined,
  meals: {},
  workouts: {},
  savedWorkouts: [],
  recents: [],
  selDate: todayKey(),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };
    case "SET_PROFILE":
      return { ...state, profile: action.payload };
    case "SET_DATE":
      return { ...state, selDate: action.payload };
    case "ADD_MEAL": {
      const day = state.selDate;
      const existing = state.meals[day] || [];
      const updated = existing.filter(m => m.id !== action.payload.id);
      updated.push(action.payload);
      return {
        ...state,
        meals: {
          ...state.meals,
          [day]: updated,
        },
      };
    }
    case "ADD_MEAL_RANGE": {
      const next = { ...state.meals };
      for (let i = 0; i < action.payload.dayKeys.length; i++) {
        const k = action.payload.dayKeys[i];
        next[k] = [...(next[k] || []), action.payload.meals[i]];
      }
      return { ...state, meals: next };
    }
    case "DELETE_MEAL": {
      const next = (state.meals[action.day] || []).filter(
        (m) => m.id !== action.id,
      );
      return { ...state, meals: { ...state.meals, [action.day]: next } };
    }
    case "ADD_WORKOUT": {
      const day = state.selDate;
      const existing = state.workouts[day] || [];
      const updated = existing.filter(w => w.id !== action.payload.id);
      updated.push(action.payload);
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [day]: updated,
        },
      };
    }
    case "DELETE_WORKOUT": {
      const next = (state.workouts[action.day] || []).filter(
        (w) => w.id !== action.id,
      );
      return { ...state, workouts: { ...state.workouts, [action.day]: next } };
    }
    case "SET_RECENTS":
      return { ...state, recents: action.payload };
    case "ADD_TEMPLATE":
      return { ...state, savedWorkouts: [...state.savedWorkouts.filter(t => t.id !== action.payload.id), action.payload] };
    case "DELETE_TEMPLATE":
      return { ...state, savedWorkouts: state.savedWorkouts.filter(t => t.id !== action.id) };
    case "SET_TEMPLATES":
      return { ...state, savedWorkouts: action.payload };
    default:
      return state;
  }
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    useAuthStore.setState({ initialized: false, loading: true });
    const unsub = useAuthStore.getState().initAuth();
    return () => {
      unsub();
      useAuthStore.setState({ initialized: false });
    };
  }, []);

  useEffect(() => {
    hydratePrefs(null);
  }, []);

  const navbarStyle = usePrefsStore((s) => s.navbarStyle);
  const theme = usePrefsStore((s) => s.theme);

  useEffect(() => {
    if (user?.uid) {
      hydratePrefs(user.uid);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) persistPrefsForUser(user.uid);
  }, [navbarStyle, theme, user?.uid]);

  useEffect(() => {
    const root = document.documentElement;
    function applyTheme() {
      if (
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    applyTheme();
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  // Hydrate from Firestore when user signs in, localStorage when guest.
  // CRITICAL: We always pre-populate state from the per-user local cache
  // BEFORE touching Firestore. This way, if Firestore is blocked (e.g. a
  // browser extension returns ERR_BLOCKED_BY_CLIENT for the Listen
  // channel), the app still recognises the user as onboarded and doesn't
  // kick them back to the onboarding flow.
  useEffect(() => {
    if (loading) return; // wait for auth to initialize

    // ── Step 1: synchronous local seed (works even when Firestore is down) ──
    if (user) {
      const localProfile = getUserKey<Profile>(user.uid, "profile");
      const localMeals =
        getUserKey<Record<string, Meal[]>>(user.uid, "meals") ?? {};
      const localWorkouts =
        getUserKey<Record<string, Workout[]>>(user.uid, "workouts") ?? {};
      const localTemplates = getUserKey<SavedWorkout[]>(user.uid, "workoutTemplates") ?? [];
      const localRecents = getUserKey<RecentMeal[]>(user.uid, "recents") ?? [];
      const today = todayKey();
      dispatch({
        type: "HYDRATE",
        payload: {
          // If we have a local profile, keep the user onboarded. Only
          // treat them as needing-onboarding if BOTH Firestore AND the
          // local cache agree there's no profile.
          profile: localProfile ?? state.profile ?? null,
          meals: { [today]: localMeals[today] ?? [] },
          workouts: { [today]: localWorkouts[today] ?? [] },
          savedWorkouts: localTemplates,
          recents: localRecents,
          selDate: today,
        },
      });
    } else {
      dispatch({
        type: "HYDRATE",
        payload: {
          profile: LS.get<Profile>(LS_KEYS.PROFILE, null),
          meals: LS.get<Record<string, Meal[]>>(LS_KEYS.MEALS, {}) ?? {},
          workouts:
            LS.get<Record<string, Workout[]>>(LS_KEYS.WORKOUTS, {}) ?? {},
          savedWorkouts: LS.get<SavedWorkout[]>("SAVED_WORKOUTS", []) ?? [],
          recents: [],
          selDate: todayKey(),
        },
      });
    }

    // ── Step 2: try to enrich with fresh data from Firestore (best effort) ──
    async function hydrateRemote() {
      if (!user) return;
      try {
        const [profile, recents, templates] = await Promise.all([
          getProfile(user.uid),
          getRecentMeals(user.uid),
          getWorkoutTemplates(user.uid),
        ]);
        const today = todayKey();
        const [meals, workouts] = await Promise.all([
          getMeals(user.uid, today),
          getWorkouts(user.uid, today),
        ]);
        // Only overwrite state if Firestore actually returned data.
        // If it returned null but we already have a local profile, keep it.
        dispatch({
          type: "HYDRATE",
          payload: {
            profile: profile ?? state.profile ?? null,
            meals: { [today]: meals },
            workouts: { [today]: workouts },
            savedWorkouts: templates,
            recents,
            selDate: today,
          },
        });
      } catch (err) {
        // Already handled by `safe()` inside db.ts — this catch is just
        // a safety net. Crucially, we do NOT null out the profile here.

        console.warn(
          "[AppContext] Remote hydrate failed, using local cache:",
          err,
        );
      }
    }
    hydrateRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // When selected date changes, load that day's data from Firestore
  useEffect(() => {
    if (!user || !state.selDate || state.meals[state.selDate] !== undefined)
      return;
    async function loadDay() {
      if (!user) return;
      const [meals, workouts] = await Promise.all([
        getMeals(user.uid, state.selDate),
        getWorkouts(user.uid, state.selDate),
      ]);
      dispatch({
        type: "HYDRATE",
        payload: {
          meals: { ...state.meals, [state.selDate]: meals },
          workouts: { ...state.workouts, [state.selDate]: workouts },
        },
      });
    }
    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selDate, user]);

  const setProfile = useCallback(
    async (p: Profile): Promise<void> => {
      dispatch({ type: "SET_PROFILE", payload: p });
      if (user) await saveProfile(user.uid, p);
      else LS.set(LS_KEYS.PROFILE, p);
    },
    [user],
  );

  const setDate = useCallback((d: string): void => {
    dispatch({ type: "SET_DATE", payload: d });
  }, []);

  const addMeal = useCallback(
    async (meal: Meal): Promise<void> => {
      dispatch({ type: "ADD_MEAL", payload: meal });
      if (user) {
        await Promise.all([
          saveMeal(user.uid, state.selDate, meal),
          saveRecentMeal(user.uid, meal),
        ]);
        const recents = await getRecentMeals(user.uid);
        dispatch({ type: "SET_RECENTS", payload: recents });
      } else {
        LS.set(LS_KEYS.MEALS, {
          ...state.meals,
          [state.selDate]: [...(state.meals[state.selDate] || []), meal],
        });
      }
    },
    [user, state.selDate, state.meals],
  );

  /**
   * Log the same meal across the next `days` calendar days starting at
   * `state.selDate`. Each day gets its own copy with a fresh id so
   * per-day editing / deletion still works normally.
   */
  const addMealForRange = useCallback(
    async (meal: Meal, days: number): Promise<void> => {
      const start = new Date(state.selDate + "T00:00:00");
      const dayKeys: string[] = [];
      for (let i = 0; i < Math.max(1, days); i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dayKeys.push(d.toISOString().slice(0, 10));
      }
      const copies: Meal[] = dayKeys.map((k, i) => ({
        ...meal,
        id: i === 0 ? meal.id : uid(),
      }));
      // single dispatch covers all days
      dispatch({
        type: "ADD_MEAL_RANGE",
        payload: { meals: copies, dayKeys },
      });
      if (user) {
        await Promise.all(
          dayKeys.map((k, i) => saveMeal(user.uid, k, copies[i])),
        );
        // only record the original as a "recent"
        await saveRecentMeal(user.uid, meal);
        const recents = await getRecentMeals(user.uid);
        dispatch({ type: "SET_RECENTS", payload: recents });
      } else {
        const nextMeals = { ...state.meals };
        for (let i = 0; i < dayKeys.length; i++) {
          const k = dayKeys[i];
          nextMeals[k] = [...(nextMeals[k] || []), copies[i]];
        }
        LS.set(LS_KEYS.MEALS, nextMeals);
      }
    },
    [user, state.selDate, state.meals],
  );

  const deleteMeal = useCallback(
    async (id: string, day: string): Promise<void> => {
      dispatch({ type: "DELETE_MEAL", id, day });
      if (user) await deleteMealDB(user.uid, day, id);
      else
        LS.set(LS_KEYS.MEALS, {
          ...state.meals,
          [day]: (state.meals[day] || []).filter((m) => m.id !== id),
        });
    },
    [user, state.meals],
  );

  const addWorkout = useCallback(
    async (w: Workout): Promise<void> => {
      dispatch({ type: "ADD_WORKOUT", payload: w });
      if (user) await saveWorkout(user.uid, state.selDate, w);
      else
        LS.set(LS_KEYS.WORKOUTS, {
          ...state.workouts,
          [state.selDate]: [...(state.workouts[state.selDate] || []), w],
        });
    },
    [user, state.selDate, state.workouts],
  );

  const deleteWorkout = useCallback(
    async (id: string, day: string): Promise<void> => {
      dispatch({ type: "DELETE_WORKOUT", id, day });
      if (user) await deleteWorkoutDB(user.uid, day, id);
      else
        LS.set(LS_KEYS.WORKOUTS, {
          ...state.workouts,
          [day]: (state.workouts[day] || []).filter((w) => w.id !== id),
        });
    },
    [user, state.workouts],
  );

  const saveTemplate = useCallback(
    async (template: SavedWorkout): Promise<void> => {
      dispatch({ type: "ADD_TEMPLATE", payload: template });
      if (user) await saveWorkoutTemplateDB(user.uid, template);
      else {
        const next = [...state.savedWorkouts.filter(t => t.id !== template.id), template];
        LS.set("SAVED_WORKOUTS", next);
      }
    },
    [user, state.savedWorkouts],
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "DELETE_TEMPLATE", id });
      if (user) await deleteWorkoutTemplateDB(user.uid, id);
      else {
        const next = state.savedWorkouts.filter(t => t.id !== id);
        LS.set("SAVED_WORKOUTS", next);
      }
    },
    [user, state.savedWorkouts],
  );

  return (
    <AppCtx.Provider
      value={{
        state,
        setProfile,
        setDate,
        addMeal,
        addMealForRange,
        deleteMeal,
        addWorkout,
        deleteWorkout,
        saveTemplate,
        deleteTemplate,
      }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
