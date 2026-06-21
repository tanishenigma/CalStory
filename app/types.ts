import type { User } from "firebase/auth";

/**
 * One exercise within a workout. Each exercise has a `name` plus a
 * type-specific `metrics` block selected by the workout's `type`.
 * Legacy flat fields (`reps`, `kg`) are still accepted for older
 * records but new entries should populate `sets` / `metrics`.
 */
export interface Exercise {
  name: string;
  /** Legacy: Per-set reps. Length equals the number of sets. */
  reps?: number[];
  /** Legacy: Weight for all sets. */
  kg?: number;
  /** Set × reps × kg entries (Resistance / Powerlifting / CrossFit). */
  sets?: { reps: number; kg: number; note?: string }[];
  /**
   * Optional per-exercise duration in minutes. Used by cardio-style
   * workouts when the user wants to track time per movement.
   */
  durationMin?: number;
  /**
   * Type-specific metrics block. Only the block matching the parent
   * workout's `type` is populated for new entries.
   */
  metrics?: ExerciseMetrics;
}

// ─── Per-activity metric blocks ────────────────────────────
export interface CardioMetrics {
  /** Distance covered in kilometres. */
  distanceKm?: number;
  /** Calories burned. */
  calories?: number;
  /** Average pace in minutes per kilometre (e.g. 6 = 6:00/km). */
  paceMinPerKm?: number;
}

export interface HiitMetrics {
  /** Number of rounds completed. */
  rounds?: number;
  /** Work interval in seconds. */
  workSec?: number;
  /** Rest interval in seconds. */
  restSec?: number;
}

export interface YogaMetrics {
  /** Free-text style (e.g. "Vinyasa Flow", "Hatha"). */
  sessionType?: string;
  /** Free-text difficulty ("Beginner", "Intermediate", "Advanced"). */
  difficulty?: string;
}

export interface PilatesMetrics {
  /** Free-text style ("Mat", "Reformer"). */
  sessionType?: string;
  difficulty?: string;
}

export interface CrossFitMetrics {
  /** Number of rounds completed. */
  rounds?: number;
  /** Total reps in the WOD. */
  reps?: number;
  /** Load used for the WOD in kg. */
  weightKg?: number;
}

export interface PowerliftingMetrics {
  /** Estimated 1-rep max in kg for the day's top set. */
  oneRmKg?: number;
}

export interface FlexibilityMetrics {
  /** Average hold time per stretch in seconds. */
  holdSec?: number;
  /** Free-text list of areas worked (e.g. "Hamstrings, Hips"). */
  areasWorked?: string;
}

export interface SportsMetrics {
  /** Game/competition score (e.g. "21–18"). */
  score?: string;
  /** Distance covered during the session, if applicable. */
  distanceKm?: number;
  /** Free-text stats (assists, points, time-on-ice, etc.). */
  stats?: string;
}

export interface OtherMetrics {
  /** Free-form notes describing what was done. */
  notes?: string;
}

export type ExerciseMetrics =
  | CardioMetrics
  | HiitMetrics
  | YogaMetrics
  | PilatesMetrics
  | CrossFitMetrics
  | PowerliftingMetrics
  | FlexibilityMetrics
  | SportsMetrics
  | OtherMetrics;

/**
 * Discriminator — the metric key the workout type expects.
 * Resistance-style types use `sets` directly, no `metrics` block.
 */
export type MetricKey =
  | "cardio"
  | "hiit"
  | "yoga"
  | "pilates"
  | "crossfit"
  | "powerlifting"
  | "flexibility"
  | "sports"
  | "other";

/** The canonical workout-type list used by the manual WorkoutForm. */
export const WORKOUT_TYPES = [
  "Resistance",
  "Cardio",
  "Yoga",
  "HIIT",
  "Pilates",
  "CrossFit",
  "Powerlifting",
  "Flexibility",
  "Sports",
  "Other",
] as const;

/** Which metric key (if any) each workout type populates per exercise. */
export const WORKOUT_METRIC_KEYS: Record<
  (typeof WORKOUT_TYPES)[number],
  MetricKey | null
> = {
  Resistance: null,
  Powerlifting: "powerlifting",
  CrossFit: "crossfit",
  HIIT: "hiit",
  Cardio: "cardio",
  Yoga: "yoga",
  Pilates: "pilates",
  Flexibility: "flexibility",
  Sports: "sports",
  Other: "other",
};

/** Returns the metric key the given workout type populates. */
export function getMetricKey(
  type: string | undefined | null,
): MetricKey | null {
  if (!type) return null;
  return WORKOUT_METRIC_KEYS[type as keyof typeof WORKOUT_METRIC_KEYS] ?? null;
}

/**
 * Schema describing how to render and persist one metric field.
 * The form iterates over this schema to build its inputs and the
 * saver uses it to parse values back into typed numbers.
 */
export interface MetricFieldSchema {
  /** Key inside the metric block (e.g. "distanceKm"). */
  key: string;
  /** Human-readable label (e.g. "Distance (km)"). */
  label: string;
  /** "number" or "text". */
  kind: "number" | "text";
  /** Optional placeholder shown in the input. */
  placeholder?: string;
}

export const WORKOUT_METRIC_SCHEMAS: Record<MetricKey, MetricFieldSchema[]> = {
  cardio: [
    {
      key: "distanceKm",
      label: "Distance (km)",
      kind: "number",
      placeholder: "0",
    },
    { key: "calories", label: "Calories", kind: "number", placeholder: "0" },
    {
      key: "paceMinPerKm",
      label: "Pace (min/km)",
      kind: "number",
      placeholder: "0",
    },
  ],
  hiit: [
    { key: "rounds", label: "Rounds", kind: "number", placeholder: "0" },
    { key: "workSec", label: "Work (sec)", kind: "number", placeholder: "40" },
    { key: "restSec", label: "Rest (sec)", kind: "number", placeholder: "20" },
  ],
  yoga: [
    {
      key: "sessionType",
      label: "Session Type",
      kind: "text",
      placeholder: "Vinyasa Flow",
    },
    {
      key: "difficulty",
      label: "Difficulty",
      kind: "text",
      placeholder: "Beginner",
    },
  ],
  pilates: [
    {
      key: "sessionType",
      label: "Session Type",
      kind: "text",
      placeholder: "Mat",
    },
    {
      key: "difficulty",
      label: "Difficulty",
      kind: "text",
      placeholder: "Intermediate",
    },
  ],
  crossfit: [
    { key: "rounds", label: "Rounds", kind: "number", placeholder: "0" },
    { key: "reps", label: "Reps", kind: "number", placeholder: "0" },
    { key: "weightKg", label: "Weight (kg)", kind: "number", placeholder: "0" },
  ],
  powerlifting: [
    {
      key: "oneRmKg",
      label: "Estimated 1RM (kg)",
      kind: "number",
      placeholder: "0",
    },
  ],
  flexibility: [
    { key: "holdSec", label: "Hold (sec)", kind: "number", placeholder: "30" },
    {
      key: "areasWorked",
      label: "Areas Worked",
      kind: "text",
      placeholder: "Hamstrings, Hips",
    },
  ],
  sports: [
    { key: "score", label: "Score", kind: "text", placeholder: "21–18" },
    {
      key: "distanceKm",
      label: "Distance (km)",
      kind: "number",
      placeholder: "0",
    },
    {
      key: "stats",
      label: "Stats",
      kind: "text",
      placeholder: "10 pts, 5 ast",
    },
  ],
  other: [
    {
      key: "notes",
      label: "Notes",
      kind: "text",
      placeholder: "Describe what you did",
    },
  ],
};

/** Back-compat helper used by old call sites: true for binary cardio. */
export function isCardioWorkout(type: string | undefined | null): boolean {
  const key = getMetricKey(type);
  // Resistance types (Resistance, Powerlifting, CrossFit, HIIT) use sets
  // OR use metric blocks that aren't "cardio-style". All other keys
  // represent time/skill activities.
  return key === "cardio";
}

export interface DetailedNutrients {
  // General
  alcohol?: number;
  caffeine?: number;
  water?: number;

  // Carbs
  netCarbs?: number;
  fiber?: number;
  sugar?: number;
  addedSugar?: number;

  // Lipids
  saturatedFat?: number;
  transFat?: number;
  polyFat?: number;
  monoFat?: number;
  cholesterol?: number;

  // Vitamins
  vitaminA?: number;
  vitaminBComplex?: number;
  vitaminB1?: number; // Thiamine
  vitaminB2?: number; // Riboflavin
  vitaminB3?: number; // Niacin
  vitaminB5?: number; // Pantothenic Acid
  vitaminB6?: number; // Pyridoxine
  vitaminB12?: number; // Cobalamin
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  folate?: number;

  // Minerals
  calcium?: number;
  copper?: number;
  iron?: number;
  magnesium?: number;
  manganese?: number;
  phosphorus?: number;
  potassium?: number;
  selenium?: number;
  sodium?: number;
  zinc?: number;

  // Protein Quality
  leucine?: number;
  bcaas?: number;
  aminoAcidProfile?: number;
}

export interface Meal {
  id: string;
  name: string;
  time: MealTime;
  cal: number;
  p: number;
  c: number;
  f: number;
  nutrients?: DetailedNutrients;
  foodId?: string; // FatSecret food ID
  /**
   * Local YYYY-MM-DD of the calendar day when `addMeal` was called.
   * Used by the streak / heatmap to verify the meal was actually
   * logged on the day it is attributed to (not backdated via date
   * picker). Optional for backwards-compat with existing meals.
   */
  savedDate?: string;
}

/**
 * Detailed nutrient breakdown for a recipe (per single serving).
 * Values are grams unless otherwise noted.
 */
export interface RecipeNutrition {
  // Macros (also duplicated on Recipe for fast access, but kept here
  // for completeness with micronutrients)
  protein: number;
  carbs: number;
  fat: number;

  // Fats breakdown
  saturatedFat?: number;
  transFat?: number;
  polyFat?: number;
  monoFat?: number;

  // Cholesterol / sodium
  cholesterol?: number; // mg
  sodium?: number; // mg

  // Carbs breakdown
  fiber?: number;
  sugar?: number;
  addedSugar?: number;
  sugarAlcohols?: number;

  // Vitamins & minerals (% daily value, 0–100)
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
}

/**
 * A reusable recipe the user can log in one or more servings. When
 * logging we expand this into one or more `Meal` entries on the
 * selected date(s).
 */
export interface Recipe {
  id: string;
  name: string;
  category: MealTime; // meal category / consumption time
  servings: number; // total servings in the recipe
  servingSize: number; // grams per single serving
  // Per-serving nutrition (calories + full micronutrient breakdown)
  calories: number;
  nutrition: RecipeNutrition;
  // Food items that are commonly paired with this recipe
  pairings?: { name: string; emoji?: string; cal?: number }[];
}

export interface RecentMeal {
  name: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  time: MealTime;
  emoji?: string;
}

export interface Workout {
  id: string;
  name: string;
  type: string;
  duration: number;
  exercises: Exercise[];
  notes: string;
}

export interface SavedWorkout {
  id: string;
  name: string;
  type: string;
  exercises: Exercise[];
}

export type MealTime = "breakfast" | "lunch" | "dinner" | "snack";

export type GoalKey = "cut" | "maintain" | "bulk";
export type IntensityKey = "mildCut" | "weightloss" | "extremeCut";
export type Gender = "male" | "female";
export type WeightUnit = "kg" | "lbs";
export type HeightUnit = "metric" | "imperial";

// ─── Profile ───────────────────────────────────────────────
export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  weight: number; // always stored in kg
  height: number; // always stored in cm
  steps: number; // average steps per day
  workoutsPerWeek: number; // resistance/cardio sessions per week
  goal: GoalKey;
  intensity: IntensityKey;
  tdee: number;
  calTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  /**
   * Date of birth as an ISO string (YYYY-MM-DD). The canonical
   * source of truth for age — `age` is derived from this on read
   * and any save that includes `dob` will recompute it.
   */
  dob?: string;
  /** Unix-ms timestamp set the first time the user finished onboarding. */
  onboardedAt?: number;
}

/**
 * A weight log entry. Each entry represents a single weigh-in.
 * The most recent entry is treated as the user's "current" weight
 * (mirrored onto `Profile.weight` for fast read in calorie math).
 *
 * Firestore path: users/{uid}/weight_logs/{logId}
 */
export interface WeightLog {
  id: string;
  /** Always stored in kg. Convert at the UI layer using weightUnit. */
  weight: number;
  /** The unit the user was viewing/typing in at log time. */
  weightUnit: WeightUnit;
  /** YYYY-MM-DD — the calendar day of the weigh-in. */
  date: string;
  /** Unix-ms timestamp the entry was written. */
  loggedAt: number;
  /** Optional free-form note (e.g. "morning, after workout"). */
  note?: string;
}

// ─── App State ─────────────────────────────────────────────
export interface AppState {
  profile: Profile | null | undefined; // undefined = not yet hydrated
  meals: Record<string, Meal[]>;
  workouts: Record<string, Workout[]>;
  savedWorkouts: SavedWorkout[];
  recents: RecentMeal[];
  /** All weight log entries, newest first. Empty until hydrated. */
  weightLogs: WeightLog[];
  selDate: string;
}

// ─── Context ───────────────────────────────────────────────
export interface AppContextValue {
  state: AppState;
  setProfile: (profile: Profile) => Promise<void>;
  setDate: (date: string) => void;
  addMeal: (meal: Meal) => Promise<void>;
  /** Log a meal across the next N days starting at `state.selDate`. */
  addMealForRange?: (meal: Meal, days: number) => Promise<void>;
  deleteMeal: (id: string, day: string) => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string, day: string) => Promise<void>;
  saveTemplate: (template: SavedWorkout) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  /**
   * Record a new weigh-in. `weightKg` is canonical (kg). Returns
   * the created `WeightLog` on success, or `null` if the write
   * failed (in which case the optimistic local state is rolled
   * back so the UI never lies).
   */
  logWeight: (
    weightKg: number,
    weightUnit: WeightUnit,
    options?: { date?: string; note?: string },
  ) => Promise<WeightLog | null>;
  /** Remove a weigh-in from the history. */
  deleteWeightLog: (id: string) => Promise<void>;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

// ─── Lib types ─────────────────────────────────────────────
export interface TDEEResult {
  tdee: number;
  calTarget: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface TDEEInput {
  gender: Gender;
  weight: number;
  height: number;
  age: number;
  steps: number;
  workoutsPerWeek: number;
  goal: GoalKey;
  /**
   * Optional. When provided, calTarget is offset by
   * `INTENSITY_ADJ[intensity][goal]` instead of the goal's
   * default hard-coded adjustment. Maintain always = 0.
   */
  intensity?: IntensityKey;
}

export interface BulkMacroInput {
  weight: number; // kg
  tdee: number; // kcal
  surplus?: number; // fraction, e.g. 0.09 for +9%  (default 0.09)
  proteinPerKg?: number; // g/kg (default 2.2, floor 2.0)
  fatPerKg?: number; // g/kg (default 1.0, floor 0.8)
}

export interface BulkMacroResult {
  totalCalories: number;
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  warnings: string[];
}

export interface Goal {
  key: GoalKey;
  emoji: string;
  label: string;
  sub: string;
  adj: number;
}

export interface MealPreset {
  name: string;
  emoji: string;
  cal: number;
  p: number;
  c: number;
  f: number;
}

// ─── AI Chat ───────────────────────────────────────────────
/**
 * A meal suggested by the AI before the user confirms it.
 * Mirrors the `Meal` shape but has no `id` yet and includes
 * an optional comment from the model about data confidence.
 */
export interface PendingMeal {
  name: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  time: MealTime;
  aiComment?: string;
}

/** A single turn in the AI chat conversation. */
export interface ChatMessage {
  id: string;
  role: "user" | "model";
  /** Display text for the bubble. */
  content: string;
  /** Set on model messages that carry a meal confirmation. */
  meal?: PendingMeal | null;
  /** Quick-add chips shown after a confirmation. */
  suggestions?: string[];
  timestamp: number;
}

/** Shape returned by the /api/ai-log-food route. */
export interface AIResponse {
  type: "greeting" | "confirmation" | "clarification" | "logged" | "error";
  message: string;
  meal: PendingMeal | null;
  suggestions: string[];
}

// ─── AI Workout Chat ────────────────────────────────────────
/** A single exercise parsed by the AI (before the user confirms). */
export interface PendingExercise {
  name: string;
  sets: { reps: number; kg: number; note?: string }[];
  /** Optional per-exercise duration in minutes. */
  durationMin?: number;
  /**
   * Optional type-specific metrics block, mirroring `Exercise.metrics`.
   * Only one of cardio/hiit/yoga/etc. is populated per exercise.
   */
  metrics?: ExerciseMetrics;
}

/**
 * A workout suggested by the AI before the user confirms it.
 * Mirrors the `Workout` shape but has no `id` yet.
 */
export interface PendingWorkout {
  name: string;
  /** Matches WORKOUT_TYPES in WorkoutForm.tsx */
  type: string;
  /** Estimated duration in minutes. Defaults to 60 when not mentioned. */
  duration: number;
  exercises: PendingExercise[];
  notes: string;
}

/** Shape returned by the /api/ai-log-workout route. */
export interface WorkoutAIResponse {
  type: "confirmation" | "clarification" | "error";
  message: string;
  workout: PendingWorkout | null;
  /** True when the AI detects a structured routine worth saving as a template. */
  askSaveTemplate: boolean;
  suggestions: string[];
}

/** A single turn in the AI workout chat conversation. */
export interface WorkoutChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  workout?: PendingWorkout | null;
  askSaveTemplate?: boolean;
  suggestions?: string[];
  timestamp: number;
}
