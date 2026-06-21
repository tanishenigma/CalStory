"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { useAuthStore, initAuthListener } from "@/app/store/authStore";
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
  getMealsInRange,
  getWorkoutsInRange,
  saveWorkoutTemplateDB,
  getWorkoutTemplates,
  deleteWorkoutTemplateDB,
  saveWeightLog,
  getWeightLogs,
  deleteWeightLogDB,
} from "@/app/lib/db";
import type {
  AppState,
  AppContextValue,
  Meal,
  Workout,
  SavedWorkout,
  Profile,
  RecentMeal,
  WeightLog,
  WeightUnit,
} from "@/app/types";

export const todayKey = (): string => new Date().toISOString().slice(0, 10);

/**
 * Returns today's date as YYYY-MM-DD using the **local** calendar,
 * avoiding the UTC-vs-local offset issue that todayKey() has for
 * users in UTC+5:30 before 05:30 IST.
 */
export const todayLocalKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const uid = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

type Action =
  | { type: "HYDRATE"; payload: Partial<AppState> }
  | { type: "SET_PROFILE"; payload: Profile | null }
  | { type: "SET_DATE"; payload: string }
  | { type: "ADD_MEAL"; payload: Meal }
  | { type: "ADD_MEAL_RANGE"; payload: { meals: Meal[]; dayKeys: string[] } }
  | { type: "DELETE_MEAL"; id: string; day: string }
  | { type: "ADD_WORKOUT"; payload: Workout }
  | { type: "DELETE_WORKOUT"; id: string; day: string }
  | { type: "SET_RECENTS"; payload: RecentMeal[] }
  | { type: "ADD_TEMPLATE"; payload: SavedWorkout }
  | { type: "DELETE_TEMPLATE"; id: string }
  | { type: "SET_TEMPLATES"; payload: SavedWorkout[] }
  | { type: "ADD_WEIGHT_LOG"; payload: WeightLog }
  | { type: "DELETE_WEIGHT_LOG"; id: string }
  | { type: "SET_WEIGHT_LOGS"; payload: WeightLog[] };

const initial: AppState = {
  profile: undefined,
  meals: {},
  workouts: {},
  savedWorkouts: [],
  recents: [],
  weightLogs: [],
  selDate: todayLocalKey(),
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
      const updated = existing.filter((m) => m.id !== action.payload.id);
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
      const updated = existing.filter((w) => w.id !== action.payload.id);
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
      return {
        ...state,
        savedWorkouts: [
          ...state.savedWorkouts.filter((t) => t.id !== action.payload.id),
          action.payload,
        ],
      };
    case "DELETE_TEMPLATE":
      return {
        ...state,
        savedWorkouts: state.savedWorkouts.filter((t) => t.id !== action.id),
      };
    case "SET_TEMPLATES":
      return { ...state, savedWorkouts: action.payload };
    case "ADD_WEIGHT_LOG":
      return {
        ...state,
        weightLogs: [action.payload, ...state.weightLogs].sort(
          (a, b) => b.loggedAt - a.loggedAt,
        ),
        // Mirror the new weight onto `profile.weight` so calorie math
        // and the dashboard read the latest value without a round-trip
        // to Firestore. Caller is responsible for persisting the log
        // — this reducer is local-state only.
        //
        // BUT only mirror when the log is for *today*. The progress
        // page lets the user backdate a weigh-in (e.g. "I forgot to
        // log yesterday's 78.5kg"). If we mirrored every entry, that
        // backdated value would clobber the *current* weight on the
        // profile. "Current" should mean "the most recent weight
        // logged for today", not "the most recent weight logged at
        // all". Caller is responsible for the same gate on the DB
        // persist. We use strict equality rather than `<=` so a
        // backdated entry can't sneak through.
        profile:
          state.profile && action.payload.date === todayLocalKey()
            ? { ...state.profile, weight: action.payload.weight }
            : state.profile,
      };
    case "DELETE_WEIGHT_LOG":
      return {
        ...state,
        weightLogs: state.weightLogs.filter((w) => w.id !== action.id),
      };
    case "SET_WEIGHT_LOGS":
      return { ...state, weightLogs: action.payload };
    default:
      return state;
  }
}

const AppCtx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    // Start the singleton Firebase auth listener. Safe to call multiple times.
    initAuthListener();
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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      dispatch({
        type: "HYDRATE",
        payload: {
          profile: null,
          meals: {},
          workouts: {},
          savedWorkouts: [],
          recents: [],
          weightLogs: [],
          selDate: todayLocalKey(),
        },
      });
      return;
    }

    async function hydrateRemote() {
      if (!user) return;
      // Fetch the profile FIRST so guards can decide (onboarded vs not)
      // as early as possible. The rest of the data hydrates in the
      // background and dispatches separately — no need to block the
      // redirect on meals / recents / templates.
      try {
        const profile = await getProfile(user.uid);
        dispatch({ type: "SET_PROFILE", payload: profile ?? null });
        // Kick off the rest in parallel. We don't await it here so the
        // onboarding → dashboard redirect isn't blocked on 5 reads.
        void hydrateSecondary(user.uid);
      } catch (err) {
        // Real error (e.g. permission denied) — surface it and let
        // the auth guard show the empty state.
        console.error("[AppContext] primary hydrate failed:", err);
        dispatch({ type: "SET_PROFILE", payload: null });
      }
    }
    hydrateRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Secondary hydration: meals/workouts/recents/templates. Runs in
  // the background after the profile is known. Failures are logged
  // but never block the user from using the app.
  const hydrateSecondary = useCallback(async (uid: string): Promise<void> => {
    try {
      const [recents, templates, weightLogs] = await Promise.all([
        getRecentMeals(uid),
        getWorkoutTemplates(uid),
        getWeightLogs(uid),
      ]);
      const today = todayLocalKey();
      // Build the past 30 local dates (inclusive of today). The
      // streak hook and WeekStrip dots both need at least a couple
      // weeks of data, so we preload a month on hydration. Per-day
      // fetches still kick in if the user navigates further back.
      const dateKeys: string[] = [];
      const base = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dateKeys.push(`${y}-${m}-${day}`);
      }
      const [mealsMap, workoutsMap] = await Promise.all([
        getMealsInRange(uid, dateKeys),
        getWorkoutsInRange(uid, dateKeys),
      ]);
      dispatch({
        type: "HYDRATE",
        payload: {
          meals: mealsMap,
          workouts: workoutsMap,
          savedWorkouts: templates,
          recents,
          weightLogs,
        },
      });
    } catch (err) {
      console.warn("[AppContext] secondary hydrate failed:", err);
    }
  }, []);

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
      if (!user) return;
      await saveProfile(user.uid, p);
    },
    [user],
  );

  const setDate = useCallback((d: string): void => {
    dispatch({ type: "SET_DATE", payload: d });
  }, []);

  const addMeal = useCallback(
    async (meal: Meal): Promise<void> => {
      // Stamp the wall-clock date (local) so streak/heatmap can
      // distinguish meals actually logged today from backdated ones.
      const stamped: Meal = { ...meal, savedDate: todayLocalKey() };
      dispatch({ type: "ADD_MEAL", payload: stamped });
      if (!user) return;
      await Promise.all([
        saveMeal(user.uid, todayLocalKey(), stamped),
        saveRecentMeal(user.uid, stamped),
      ]);
      const recents = await getRecentMeals(user.uid);
      dispatch({ type: "SET_RECENTS", payload: recents });
    },
    [user, state.selDate],
  );

  /**
   * Log the same meal across the next `days` calendar days starting at
   * `state.selDate`. Each day gets its own copy with a fresh id so
   * per-day editing / deletion still works normally.
   */
  const addMealForRange = useCallback(
    async (meal: Meal, days: number): Promise<void> => {
      const savedDate = todayLocalKey();
      const start = new Date(state.selDate + "T00:00:00");
      const dayKeys: string[] = [];
      for (let i = 0; i < Math.max(1, days); i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dayKeys.push(`${y}-${m}-${day}`);
      }
      const copies: Meal[] = dayKeys.map((k, i) => ({
        ...meal,
        id: i === 0 ? meal.id : uid(),
        // Same savedDate for all copies — they were all initiated today.
        savedDate,
      }));
      // single dispatch covers all days
      dispatch({
        type: "ADD_MEAL_RANGE",
        payload: { meals: copies, dayKeys },
      });
      if (!user) return;
      await Promise.all(
        dayKeys.map((k, i) => saveMeal(user.uid, k, copies[i])),
      );
      // only record the original as a "recent"
      await saveRecentMeal(user.uid, meal);
      const recents = await getRecentMeals(user.uid);
      dispatch({ type: "SET_RECENTS", payload: recents });
    },
    [user, state.selDate],
  );

  const deleteMeal = useCallback(
    async (id: string, day: string): Promise<void> => {
      dispatch({ type: "DELETE_MEAL", id, day });
      if (!user) return;
      await deleteMealDB(user.uid, day, id);
    },
    [user],
  );

  const addWorkout = useCallback(
    async (w: Workout): Promise<void> => {
      dispatch({ type: "ADD_WORKOUT", payload: w });
      if (!user) return;
      await saveWorkout(user.uid, state.selDate, w);
    },
    [user, state.selDate],
  );

  const deleteWorkout = useCallback(
    async (id: string, day: string): Promise<void> => {
      dispatch({ type: "DELETE_WORKOUT", id, day });
      if (!user) return;
      await deleteWorkoutDB(user.uid, day, id);
    },
    [user],
  );

  const saveTemplate = useCallback(
    async (template: SavedWorkout): Promise<void> => {
      dispatch({ type: "ADD_TEMPLATE", payload: template });
      if (!user) return;
      await saveWorkoutTemplateDB(user.uid, template);
    },
    [user],
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "DELETE_TEMPLATE", id });
      if (!user) return;
      await deleteWorkoutTemplateDB(user.uid, id);
    },
    [user],
  );

  /**
   * Record a new weigh-in. Writes a `WeightLog` document and
   * mirrors the new weight onto `profile.weight` so the change
   * is visible everywhere (dashboard calorie math, settings
   * badge, progress page chart) without a Firestore round-trip.
   *
   * The caller passes the weight already in kg. `weightUnit` is
   * stored alongside so the UI can render the original unit the
   * user typed in.
   */
  const logWeight = useCallback(
    async (
      weightKg: number,
      weightUnit: WeightUnit,
      options?: { date?: string; note?: string },
    ): Promise<WeightLog | null> => {
      if (!user) return null;
      const log: WeightLog = {
        id: uid(),
        weight: weightKg,
        weightUnit,
        date: options?.date ?? todayLocalKey(),
        loggedAt: Date.now(),
        note: options?.note,
      };
      // "Current" = the log is dated today. The form date picker
      // restricts the max to today, so this is effectively the only
      // way the mirror triggers. We use strict equality (not `<=`)
      // so a backdated entry never clobbers the real current weight
      // even if the picker allows it via manual editing.
      const isCurrentLog = log.date === todayLocalKey();
      // Optimistic local update — both the log and the mirrored
      // profile weight. The reducer handles the sort + mirror
      // (and applies the same isCurrentLog gate).
      dispatch({ type: "ADD_WEIGHT_LOG", payload: log });
      try {
        await Promise.all([
          saveWeightLog(user.uid, log),
          // Persist the mirrored weight onto the profile so the
          // dashboard / calorie math see the same value the user
          // just entered — but only when the log is for today.
          // Backdated weigh-ins are historical data, not "current
          // weight" updates, so we leave the existing profile
          // weight alone in that case.
          //
          // If state.profile is null (not yet hydrated), fetch it
          // first so we never skip the profile weight update.
          isCurrentLog
            ? (async () => {
                try {
                  const profile = state.profile ?? (await getProfile(user.uid));
                  if (profile) {
                    await saveProfile(user.uid, {
                      ...profile,
                      weight: weightKg,
                    });
                  }
                } catch (err) {
                  console.error(
                    "[AppContext] logWeight: profile sync failed:",
                    err,
                  );
                }
              })()
            : Promise.resolve(),
        ]);
        return log;
      } catch (err) {
        console.error("[AppContext] logWeight failed:", err);
        // Roll back the optimistic log so the UI matches the DB.
        dispatch({ type: "DELETE_WEIGHT_LOG", id: log.id });
        return null;
      }
    },
    [user, state.profile],
  );

  const deleteWeightLog = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "DELETE_WEIGHT_LOG", id });
      if (!user) return;
      await deleteWeightLogDB(user.uid, id);
    },
    [user],
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
        logWeight,
        deleteWeightLog,
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
