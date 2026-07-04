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
import { useProfileStore } from "@/app/store/profileStore";
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
  saveFitnessLog,
  getFitnessLogs,
  saveFastingSession,
  getFastingSession,
  clearFastingSessionDB,
  saveHydrationLog,
  getHydrationLog,
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
  FitnessLog,
  FastingSession,
  HydrationLog,
  HydrationEntry,
} from "@/app/types";
import { calcTDEE } from "@/app/lib/tdee";

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
  | { type: "SET_WEIGHT_LOGS"; payload: WeightLog[] }
  // Fitness
  | { type: "SET_FITNESS_LOG"; payload: FitnessLog }
  // Fasting
  | { type: "SET_FASTING_SESSION"; payload: FastingSession | null }
  // Hydration
  | { type: "SET_HYDRATION_LOG"; payload: HydrationLog | null }
  | { type: "ADD_HYDRATION_ENTRY"; payload: HydrationEntry }
  | { type: "REMOVE_HYDRATION_ENTRY"; id: string }
  | { type: "SET_HYDRATION_GOAL"; goalMl: number };

const initial: AppState = {
  profile: undefined,
  meals: {},
  workouts: {},
  savedWorkouts: [],
  recents: [],
  weightLogs: [],
  selDate: todayLocalKey(),
  fitnessLogs: {},
  fastingSession: null,
  hydrationLog: null,
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
    case "SET_FITNESS_LOG":
      return {
        ...state,
        fitnessLogs: {
          ...state.fitnessLogs,
          [action.payload.date]: action.payload,
        },
      };
    case "SET_FASTING_SESSION":
      return { ...state, fastingSession: action.payload };
    case "SET_HYDRATION_LOG":
      return { ...state, hydrationLog: action.payload };
    case "ADD_HYDRATION_ENTRY": {
      const existing = state.hydrationLog ?? {
        date: todayLocalKey(),
        goalMl: 2500,
        entries: [],
      };
      return {
        ...state,
        hydrationLog: {
          ...existing,
          entries: [...existing.entries, action.payload],
        },
      };
    }
    case "REMOVE_HYDRATION_ENTRY": {
      if (!state.hydrationLog) return state;
      return {
        ...state,
        hydrationLog: {
          ...state.hydrationLog,
          entries: state.hydrationLog.entries.filter((e) => e.id !== action.id),
        },
      };
    }
    case "SET_HYDRATION_GOAL": {
      if (!state.hydrationLog) {
        return {
          ...state,
          hydrationLog: {
            date: todayLocalKey(),
            goalMl: action.goalMl,
            entries: [],
          },
        };
      }
      return {
        ...state,
        hydrationLog: { ...state.hydrationLog, goalMl: action.goalMl },
      };
    }
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

  // One-time migration: clear legacy localStorage keys from before the
  // privacy-tightening refactor. Previously we cached the full profile
  // (weight, height, age, DOB) and an auth hint (uid, email,
  // displayName, photoURL) in localStorage. Those keys are no longer
  // written by the app — purge them on first boot so users who
  // visited before this change don't keep that data on disk.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const LEGACY_KEYS = [
      "ft_auth_hint",
      "ft_profile",
      "ft_meals",
      "ft_workouts",
      "ft_profile_user",
      "ft_meals_user",
      "ft_workouts_user",
    ];
    const PREFIXES = [
      "ft_profile_user_",
      "ft_meals_user_",
      "ft_workouts_user_",
    ];
    try {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k);
      // Sweep per-uid mirrors — localStorage is small in practice so
      // iterating once is cheap.
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && PREFIXES.some((p) => k.startsWith(p))) toRemove.push(k);
      }
      for (const k of toRemove) localStorage.removeItem(k);
    } catch {
      // Ignore quota / privacy-mode errors — nothing critical here.
    }
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
      // Visibly clear the profile store on sign-out so the landing
      // CTA flips back to "Get started free" without a refresh.
      useProfileStore.getState().setLive(false);
      return;
    }

    async function hydrateRemote() {
      if (!user) return;
      // Fetch the profile FIRST so guards can decide (onboarded vs not)
      // as early as possible. The rest of the data hydrates in the
      // background and dispatches separately — no need to block the
      // redirect on meals / recents / templates.
      //
      // We deliberately do NOT read a cached profile from localStorage
      // here. Profile PII (weight, height, age, DOB) stays in Firestore;
      // the user sees a skeleton until the first read completes. With
      // Firebase's browserLocalPersistence, onAuthStateChanged resolves
      // synchronously from IndexedDB on hard refresh, so the only
      // network round-trip on a warm cache is this getProfile().
      try {
        const profile = await getProfile(user.uid);
        dispatch({ type: "SET_PROFILE", payload: profile ?? null });
        // Mirror to the global profile store so marketing-page CTAs
        // and any other consumer converge on the source of truth.
        useProfileStore.getState().setLive(profile != null);
        // Kick off the rest in parallel. We don't await it here so the
        // onboarding → dashboard redirect isn't blocked on 5 reads.
        void hydrateSecondary(user.uid);
      } catch (err) {
        // Real error (e.g. permission denied) — surface it and let
        // the auth guard show the empty state.
        console.error("[AppContext] primary hydrate failed:", err);
        dispatch({ type: "SET_PROFILE", payload: null });
        useProfileStore.getState().setLive(false);
      }
    }
    hydrateRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  // Secondary hydration: meals/workouts/recents/templates/fasting/hydration.
  // Runs in the background after the profile is known.
  const hydrateSecondary = useCallback(async (uid: string): Promise<void> => {
    try {
      const [recents, templates, weightLogs, fastingSession, hydrationLog] =
        await Promise.all([
          getRecentMeals(uid),
          getWorkoutTemplates(uid),
          getWeightLogs(uid),
          getFastingSession(uid),
          getHydrationLog(uid, todayLocalKey()),
        ]);
      const today = todayLocalKey();
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
          fastingSession: fastingSession ?? null,
          hydrationLog: hydrationLog ?? null,
        },
      });
      void today; // suppress unused-var lint
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
      // Updating the profile always means a profile now exists.
      // Reflect that immediately so CTA copy across the app updates.
      useProfileStore.getState().setLive(true);
      if (!user) return;
      // Firestore is the only source of truth for profile data. We no
      // longer mirror the profile to localStorage — keeping it there
      // would have put weight, height, age, DOB etc. on disk in plain
      // JSON for every visitor.
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

      // Persist to Firestore. saveWeightLog returns false on failure,
      // so we check the result to decide whether to rollback.
      const saved = await saveWeightLog(user.uid, log);
      if (!saved) {
        // Firestore write failed — rollback the optimistic update so
        // the UI stays in sync with what was actually persisted.
        dispatch({ type: "DELETE_WEIGHT_LOG", id: log.id });
        return null;
      }

      // Also persist the mirrored weight onto the profile so the
      // dashboard / calorie math see the same value the user
      // just entered — but only when the log is for today.
      // Backdated weigh-ins are historical data, not "current
      // weight" updates, so we leave the existing profile
      // weight alone in that case.
      //
      // If state.profile is null (not yet hydrated), fetch it
      // first so we never skip the profile weight update.
      if (isCurrentLog) {
        try {
          const profile = state.profile ?? (await getProfile(user.uid));
          if (profile) {
            await saveProfile(user.uid, {
              ...profile,
              weight: weightKg,
            });
          }
        } catch (err) {
          console.error("[AppContext] logWeight: profile sync failed:", err);
          // Non-fatal: the weight log itself was saved; only the
          // profile mirror failed. The user can still see the entry.
        }
      }

      return log;
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

  // ── Fitness actions ───────────────────────────────────────
  const saveFitnessLogAction = useCallback(
    async (log: FitnessLog): Promise<void> => {
      dispatch({ type: "SET_FITNESS_LOG", payload: log });
      if (!user) return;
      await saveFitnessLog(user.uid, log);

      // Mirror the synced steps + active calories onto the profile, then
      // recompute TDEE / calTarget. This is what makes the calorie
      // dashboard "live" instead of stale until the user re-runs
      // onboarding.
      //
      // Gate: recompute when EITHER
      //   - the source changed (different provider / manual entry), OR
      //   - the step bucket crossed a TDEE-bucket boundary. The activity
      //     multiplier in calcTDEE only changes at hard thresholds
      //     (5k/7.5k/10k/15k), so we recompute at those exact crossings
      //     to avoid pointless writes on every minor step fluctuation.
      try {
        const current = state.profile ?? (await getProfile(user.uid));
        if (!current) return;

        const sourceChanged = current.syncedFromSource !== log.source;
        const stepBucket = (s: number): 0 | 1 | 2 | 3 | 4 => {
          if (s < 5000) return 0;
          if (s < 7500) return 1;
          if (s < 10000) return 2;
          if (s < 15000) return 3;
          return 4;
        };
        const stepBucketChanged =
          stepBucket(current.syncedSteps ?? current.steps) !==
          stepBucket(log.steps);

        if (sourceChanged || stepBucketChanged) {
          const tdeeResult = calcTDEE({
            gender: current.gender,
            weight: current.weight,
            height: current.height,
            age: current.age,
            steps: log.steps,
            workoutsPerWeek: current.workoutsPerWeek,
            goal: current.goal,
            intensity: current.intensity,
          });
          const updated: Profile = {
            ...current,
            steps: log.steps,
            tdee: tdeeResult.tdee,
            calTarget: tdeeResult.calTarget,
            protein: tdeeResult.protein,
            carbs: tdeeResult.carbs,
            fat: tdeeResult.fat,
            syncedSteps: log.steps,
            syncedActiveCalories: log.activeCalories,
            syncedFromSource: log.source,
          };
          await saveProfile(user.uid, updated);
          // Only mirror to local state — leave the "macro weight changes"
          // dispatch to the auth-guard / onboarding flow. This prevents
          // the user's currently-displayed meal targets from flickering
          // mid-day while they eat.
          dispatch({ type: "SET_PROFILE", payload: updated });
        } else {
          // Steps in the same bucket and source hasn't changed — just
          // update the cached mirror (cheap) and skip the TDEE recompute.
          if (
            current.syncedSteps !== log.steps ||
            current.syncedActiveCalories !== log.activeCalories
          ) {
            const updated: Profile = {
              ...current,
              syncedSteps: log.steps,
              syncedActiveCalories: log.activeCalories,
              syncedFromSource: log.source,
            };
            await saveProfile(user.uid, updated);
          }
        }
      } catch (err) {
        // Non-fatal — the fitness log itself was saved; only the
        // profile mirror / TDEE bump failed.
        console.error("[AppContext] fitness profile sync failed:", err);
      }
    },
    [user, state.profile],
  );

  // ── Fasting actions ───────────────────────────────────────
  const setFastingSession = useCallback(
    async (session: FastingSession): Promise<void> => {
      dispatch({ type: "SET_FASTING_SESSION", payload: session });
      if (!user) return;
      await saveFastingSession(user.uid, session);
    },
    [user],
  );

  const clearFastingSession = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_FASTING_SESSION", payload: null });
    if (!user) return;
    await clearFastingSessionDB(user.uid);
  }, [user]);

  // ── Hydration actions ─────────────────────────────────────
  const addHydration = useCallback(
    async (ml: number): Promise<void> => {
      const entry: HydrationEntry = {
        id: uid(),
        ml,
        loggedAt: Date.now(),
      };
      dispatch({ type: "ADD_HYDRATION_ENTRY", payload: entry });
      if (!user) return;
      // Re-read current state after optimistic update to get the full log
      // (the reducer has already updated it, but we need the after-state).
      // We pass a callback to setState-like pattern; here we rely on the
      // fact that dispatch is synchronous in useReducer, so state is stale.
      // Instead we'll persist based on the reducer's own output via a
      // derived local log object.
      const today = todayLocalKey();
      const currentLog = state.hydrationLog ?? {
        date: today,
        goalMl: 2500,
        entries: [],
      };
      const updatedLog: HydrationLog = {
        ...currentLog,
        entries: [...currentLog.entries, entry],
      };
      await saveHydrationLog(user.uid, updatedLog);
    },
    [user, state.hydrationLog],
  );

  const removeHydration = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "REMOVE_HYDRATION_ENTRY", id });
      if (!user || !state.hydrationLog) return;
      const updatedLog: HydrationLog = {
        ...state.hydrationLog,
        entries: state.hydrationLog.entries.filter((e) => e.id !== id),
      };
      await saveHydrationLog(user.uid, updatedLog);
    },
    [user, state.hydrationLog],
  );

  const setHydrationGoal = useCallback(
    async (goalMl: number): Promise<void> => {
      dispatch({ type: "SET_HYDRATION_GOAL", goalMl });
      if (!user) return;
      const today = todayLocalKey();
      const currentLog: HydrationLog = state.hydrationLog ?? {
        date: today,
        goalMl,
        entries: [],
      };
      await saveHydrationLog(user.uid, { ...currentLog, goalMl });
    },
    [user, state.hydrationLog],
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
        saveFitnessLog: saveFitnessLogAction,
        setFastingSession,
        clearFastingSession,
        addHydration,
        removeHydration,
        setHydrationGoal,
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
