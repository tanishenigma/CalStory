import type { User } from "firebase/auth";

export interface Exercise {
  name: string;
  reps?: number[];
  kg?: number;
  sets?: { reps: number; kg: number; note?: string }[];
  durationMin?: number;
  metrics?: ExerciseMetrics;
}

// ─── Per-activity metric blocks ────────────────────────────
export interface CardioMetrics {
  distanceKm?: number;
  calories?: number;
  paceMinPerKm?: number;
}

export interface HiitMetrics {
  rounds?: number;
  workSec?: number;
  restSec?: number;
}

export interface YogaMetrics {
  sessionType?: string;
  difficulty?: string;
}

export interface PilatesMetrics {
  sessionType?: string;
  difficulty?: string;
}

export interface CrossFitMetrics {
  rounds?: number;
  reps?: number;
  weightKg?: number;
}

export interface PowerliftingMetrics {
  oneRmKg?: number;
}

export interface FlexibilityMetrics {
  holdSec?: number;
  areasWorked?: string;
}

export interface SportsMetrics {
  score?: string;
  distanceKm?: number;
  stats?: string;
}

export interface OtherMetrics {
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

export function getMetricKey(
  type: string | undefined | null,
): MetricKey | null {
  if (!type) return null;
  return WORKOUT_METRIC_KEYS[type as keyof typeof WORKOUT_METRIC_KEYS] ?? null;
}

export interface MetricFieldSchema {
  key: string;
  label: string;
  kind: "number" | "text";
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

export function isCardioWorkout(type: string | undefined | null): boolean {
  const key = getMetricKey(type);

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
  savedDate?: string;
}

export interface RecipeNutrition {
  protein: number;
  carbs: number;
  fat: number;

  saturatedFat?: number;
  transFat?: number;
  polyFat?: number;
  monoFat?: number;

  cholesterol?: number; // mg
  sodium?: number; // mg

  fiber?: number;
  sugar?: number;
  addedSugar?: number;
  sugarAlcohols?: number;

  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
}

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

  weight: number;

  weightUnit: WeightUnit;

  date: string;

  loggedAt: number;

  note?: string;
}

// ─── App State ─────────────────────────────────────────────
export interface AppState {
  profile: Profile | null | undefined; // undefined = not yet hydrated
  meals: Record<string, Meal[]>;
  workouts: Record<string, Workout[]>;
  savedWorkouts: SavedWorkout[];
  recents: RecentMeal[];

  weightLogs: WeightLog[];
  selDate: string;
}

// ─── Context ───────────────────────────────────────────────
export interface AppContextValue {
  state: AppState;
  setProfile: (profile: Profile) => Promise<void>;
  setDate: (date: string) => void;
  addMeal: (meal: Meal) => Promise<void>;
  addMealForRange?: (meal: Meal, days: number) => Promise<void>;
  deleteMeal: (id: string, day: string) => Promise<void>;
  addWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string, day: string) => Promise<void>;
  saveTemplate: (template: SavedWorkout) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  logWeight: (
    weightKg: number,
    weightUnit: WeightUnit,
    options?: { date?: string; note?: string },
  ) => Promise<WeightLog | null>;

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

export interface ChatMessage {
  id: string;
  role: "user" | "model";

  content: string;

  meal?: PendingMeal | null;

  suggestions?: string[];
  timestamp: number;
}

export interface AIResponse {
  type: "greeting" | "confirmation" | "clarification" | "logged" | "error";
  message: string;
  meal: PendingMeal | null;
  suggestions: string[];
}

// ─── AI Workout Chat ────────────────────────────────────────

export interface PendingExercise {
  name: string;
  sets: { reps: number; kg: number; note?: string }[];

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

  type: string;

  duration: number;
  exercises: PendingExercise[];
  notes: string;
}

export interface WorkoutAIResponse {
  type: "confirmation" | "clarification" | "error";
  message: string;
  workout: PendingWorkout | null;

  askSaveTemplate: boolean;
  suggestions: string[];
}

export interface WorkoutChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  workout?: PendingWorkout | null;
  askSaveTemplate?: boolean;
  suggestions?: string[];
  timestamp: number;
  /**
   * When true, the workout in this message was loaded from one of the
   * user's saved routines (not freshly parsed by the AI). The UI uses
   * this to hide the "Save as reusable template" toggle until the
   * user edits anything.
   */
  fromSavedRoutine?: boolean;
}
