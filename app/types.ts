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
}

// ─── App State ─────────────────────────────────────────────
export interface AppState {
  profile: Profile | null | undefined; // undefined = not yet hydrated
  meals: Record<string, Meal[]>;
  workouts: Record<string, Workout[]>;
  savedWorkouts: SavedWorkout[];
  recents: RecentMeal[];
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
