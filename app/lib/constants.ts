import type { Goal, MealPreset, MealTime, Recipe } from "@/app/types";
import { Sunrise, Sun, Moon, Apple, type LucideIcon } from "lucide-react";

export const DAY_LABELS: string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const MEAL_ICONS: Record<MealTime, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Apple,
};

export const MEAL_TIMES: MealTime[] = ["breakfast", "lunch", "dinner", "snack"];

export const SERVING_UNITS = ["g", "ml", "cup", "piece"] as const;

// Legacy UI descriptors — no longer used for TDEE calculation.
// Calculation now uses getActivityMultiplier(steps, workoutsPerWeek) in tdee.ts.
interface ActivityLevelDescriptor {
  key: string;
  label: string;
  sub: string;
  factor: number;
}

export const ACTIVITY_LEVELS: ActivityLevelDescriptor[] = [
  {
    key: "sedentary",
    label: "Sedentary",
    sub: "Little or no exercise",
    factor: 1.2,
  },
  {
    key: "light",
    label: "Lightly Active",
    sub: "1–3 days/week",
    factor: 1.375,
  },
  {
    key: "moderate",
    label: "Moderately Active",
    sub: "3–5 days/week",
    factor: 1.55,
  },
  { key: "very", label: "Very Active", sub: "6–7 days/week", factor: 1.725 },
  {
    key: "extra",
    label: "Extra Active",
    sub: "Physical job or 2× training/day",
    factor: 1.9,
  },
];

export const GOALS: Goal[] = [
  { key: "cut", emoji: "🔥", label: "Cut", sub: "Lose fat", adj: -300 },
  { key: "maintain", emoji: "⚖️", label: "Maintain", sub: "Stay lean", adj: 0 },
  { key: "bulk", emoji: "💪", label: "Bulk", sub: "Build muscle", adj: +300 },
];

export const PRESETS: MealPreset[] = [
  { name: "Whey Shake", emoji: "🥛", cal: 120, p: 24, c: 3, f: 2 },
  { name: "Paneer 100g", emoji: "🧀", cal: 265, p: 18, c: 3, f: 20 },
  { name: "Rice 1 cup", emoji: "🍚", cal: 206, p: 4, c: 45, f: 0 },
  { name: "Boiled Egg", emoji: "🥚", cal: 78, p: 6, c: 1, f: 5 },
  { name: "Dal 1 bowl", emoji: "🍲", cal: 180, p: 9, c: 30, f: 3 },
  { name: "Banana", emoji: "🍌", cal: 89, p: 1, c: 23, f: 0 },
];

export const FEATURES = [
  {
    icon: "⚡",
    title: "Precision Calorie Tracking",
    desc: "TDEE via Mifflin–St Jeor. Targets that adapt as your body changes.",
    span: 2,
  },
  {
    icon: "🏋️",
    title: "Workout Logging",
    desc: "Every set, rep, and weight. Progressive overload, visualised.",
    span: 1,
  },
  {
    icon: "📊",
    title: "7-Day Trend Charts",
    desc: "Calories, protein, sessions — your week at a glance.",
    span: 1,
  },
  {
    icon: "🎯",
    title: "Smart Goal Targets",
    desc: "Cut, maintain, or bulk. Slow, moderate, aggressive. Your call.",
    span: 2,
  },
] as const;

export const STEPS = [
  {
    n: "01",
    title: "Sign in",
    desc: "Google sign-in. TDEE calculated instantly.",
  },
  {
    n: "02",
    title: "Set your goal",
    desc: "Cut, maintain, or bulk at your chosen pace.",
  },
  {
    n: "03",
    title: "Log daily",
    desc: "Meals and workouts in seconds, not minutes.",
  },
  {
    n: "04",
    title: "Read your trends",
    desc: "Seven-day charts. Adjust. Repeat.",
  },
] as const;

export const STATS = [
  { val: "< 2 min", label: "to first log" },
  { val: "1.8g", label: "protein target per kg" },
  { val: "100%", label: "free, no paywalls" },
] as const;

export const WORKOUT_TYPES: string[] = [
  "Strength",
  "Cardio",
  "HIIT",
  "Yoga",
  "Calisthenics",
  "Other",
];

/**
 * Recipe presets — each entry represents a single serving's worth
 * of nutrition, so the values can be directly logged as a Meal.
 */
export const RECIPE_PRESETS: Recipe[] = [
  {
    id: "r-boiled-egg",
    name: "Boiled Egg",
    category: "breakfast",
    servings: 1,
    servingSize: 50,
    calories: 78,
    nutrition: {
      protein: 6,
      carbs: 1,
      fat: 5,
      saturatedFat: 1.6,
      transFat: 0,
      polyFat: 0.7,
      monoFat: 2,
      cholesterol: 186,
      sodium: 62,
      fiber: 0,
      sugar: 0.6,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 2,
      calcium: 25,
      iron: 0.6,
      potassium: 63,
      vitaminA: 5,
      vitaminC: 0,
    },
    pairings: [
      { name: "Whey Shake", emoji: "🥛", cal: 120 },
      { name: "Banana", emoji: "🍌", cal: 89 },
    ],
  },
  {
    id: "r-dal-bowl",
    name: "Dal 1 bowl",
    category: "lunch",
    servings: 1,
    servingSize: 200,
    calories: 180,
    nutrition: {
      protein: 9,
      carbs: 30,
      fat: 3,
      saturatedFat: 0.5,
      transFat: 0,
      polyFat: 1,
      monoFat: 1.2,
      cholesterol: 0,
      sodium: 380,
      fiber: 8,
      sugar: 3,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 40,
      iron: 2.5,
      potassium: 480,
      vitaminA: 1,
      vitaminC: 4,
    },
    pairings: [
      { name: "Rice 1 cup", emoji: "🍚", cal: 206 },
      { name: "Boiled Egg", emoji: "🥚", cal: 78 },
    ],
  },
  {
    id: "r-banana",
    name: "Banana",
    category: "snack",
    servings: 1,
    servingSize: 118,
    calories: 89,
    nutrition: {
      protein: 1,
      carbs: 23,
      fat: 0,
      saturatedFat: 0,
      transFat: 0,
      polyFat: 0,
      monoFat: 0,
      cholesterol: 0,
      sodium: 1,
      fiber: 3,
      sugar: 12,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 5,
      iron: 0.3,
      potassium: 358,
      vitaminA: 1,
      vitaminC: 17,
    },
    pairings: [
      { name: "Whey Shake", emoji: "🥛", cal: 120 },
      { name: "Boiled Egg", emoji: "🥚", cal: 78 },
    ],
  },
  {
    id: "r-rice-cup",
    name: "Rice 1 cup",
    category: "lunch",
    servings: 1,
    servingSize: 158,
    calories: 206,
    nutrition: {
      protein: 4,
      carbs: 45,
      fat: 0,
      saturatedFat: 0,
      transFat: 0,
      polyFat: 0,
      monoFat: 0,
      cholesterol: 0,
      sodium: 2,
      fiber: 0.6,
      sugar: 0,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 10,
      iron: 1.9,
      potassium: 55,
      vitaminA: 0,
      vitaminC: 0,
    },
    pairings: [
      { name: "Dal 1 bowl", emoji: "🍲", cal: 180 },
      { name: "Paneer 100g", emoji: "🧀", cal: 265 },
    ],
  },
  {
    id: "r-whey-shake",
    name: "Whey Shake",
    category: "snack",
    servings: 1,
    servingSize: 250,
    calories: 120,
    nutrition: {
      protein: 24,
      carbs: 3,
      fat: 2,
      saturatedFat: 1,
      transFat: 0,
      polyFat: 0.3,
      monoFat: 0.5,
      cholesterol: 50,
      sodium: 60,
      fiber: 0,
      sugar: 2,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 150,
      iron: 0.2,
      potassium: 180,
      vitaminA: 2,
      vitaminC: 0,
    },
    pairings: [
      { name: "Banana", emoji: "🍌", cal: 89 },
      { name: "Boiled Egg", emoji: "🥚", cal: 78 },
    ],
  },
  {
    id: "r-paneer",
    name: "Paneer 100g",
    category: "lunch",
    servings: 1,
    servingSize: 100,
    calories: 265,
    nutrition: {
      protein: 18,
      carbs: 3,
      fat: 20,
      saturatedFat: 13,
      transFat: 0.5,
      polyFat: 0.6,
      monoFat: 5,
      cholesterol: 55,
      sodium: 18,
      fiber: 0,
      sugar: 2,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 480,
      iron: 0.2,
      potassium: 100,
      vitaminA: 8,
      vitaminC: 0,
    },
    pairings: [
      { name: "Rice 1 cup", emoji: "🍚", cal: 206 },
      { name: "Dal 1 bowl", emoji: "🍲", cal: 180 },
    ],
  },
  {
    id: "r-paneer-biryani",
    name: "Paneer Biryani",
    category: "dinner",
    servings: 1,
    servingSize: 350,
    calories: 490,
    nutrition: {
      protein: 32,
      carbs: 55,
      fat: 18,
      saturatedFat: 6,
      transFat: 0,
      polyFat: 3,
      monoFat: 7,
      cholesterol: 110,
      sodium: 720,
      fiber: 3,
      sugar: 4,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 80,
      iron: 3.5,
      potassium: 480,
      vitaminA: 6,
      vitaminC: 8,
    },
    pairings: [
      { name: "Greek Salad", emoji: "🥗", cal: 120 },
      { name: "Whey Shake", emoji: "🥛", cal: 120 },
    ],
  },
  {
    id: "r-greek-salad",
    name: "Greek Salad",
    category: "lunch",
    servings: 1,
    servingSize: 220,
    calories: 180,
    nutrition: {
      protein: 6,
      carbs: 10,
      fat: 13,
      saturatedFat: 4,
      transFat: 0,
      polyFat: 1.5,
      monoFat: 6.5,
      cholesterol: 18,
      sodium: 480,
      fiber: 3,
      sugar: 4,
      addedSugar: 0,
      sugarAlcohols: 0,
      vitaminD: 0,
      calcium: 130,
      iron: 1.5,
      potassium: 320,
      vitaminA: 18,
      vitaminC: 22,
    },
    pairings: [
      { name: "Paneer Biryani", emoji: "🍛", cal: 490 },
      { name: "Boiled Egg", emoji: "🥚", cal: 78 },
    ],
  },
];
