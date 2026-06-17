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
          selDate: todayKey(),
        },
      });
      return;
    }

    async function hydrateRemote() {
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
        dispatch({
          type: "HYDRATE",
          payload: {
            profile,
            meals: { [today]: meals },
            workouts: { [today]: workouts },
            savedWorkouts: templates,
            recents,
            selDate: today,
          },
        });
      } catch (err) {
        dispatch({
          type: "HYDRATE",
          payload: {
            profile: null,
            meals: {},
            workouts: {},
            savedWorkouts: [],
            recents: [],
            selDate: todayKey(),
          },
        });
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
      dispatch({ type: "ADD_MEAL", payload: meal });
      if (!user) return;
      await Promise.all([
        saveMeal(user.uid, state.selDate, meal),
        saveRecentMeal(user.uid, meal),
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
