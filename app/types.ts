import type { User } from "firebase/auth";

export interface Exercise {
  name: string;
  /** Legacy: Per-set reps. Length equals the number of sets. */
  reps?: number[];
  /** Legacy: Weight for all sets. */
  kg?: number;
  /** New structure: Individual reps and kg per set */
  sets?: { reps: number; kg: number }[];
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
export type IntensityKey = "slow" | "moderate" | "aggressive";
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
