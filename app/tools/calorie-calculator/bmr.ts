/**
 * BMR / TDEE math for the public Calorie Calculator tool page
 * at `/tools/calorie-calculator`.
 *
 * Pure functions, no React, no DOM, no Firebase — importable from
 * server and client. Mirrors the Mifflin-St Jeor pattern that
 * `app/lib/tdee.ts` uses for onboarding (same coefficients), but
 * stays self-contained so the public tool:
 *   • is decoupled from internal BMI / macro-split logic
 *   • can be exercised by vitest without dragging in the
 *     AppContext / Firestore plumbing
 *   • can re-export the unit-conversion helpers from
 *     `app/lib/units.ts` so the calculator and onboarding form
 *     agree on every display number
 */

export type Sex = "male" | "female";

export type FormulaKey = "mifflin" | "harris" | "katch";

export type ActivityKey =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very";

/**
 * Five-step activity ladder mapped 1:1 to the dropdown options
 * rendered in the calculator UI. Values are the standard TDEE
 * multipliers from the Harris-Benedict (1990) revision, which
 * every modern BMR calculator (Mifflin, Katch, etc.) borrows
 * for the "BMR × activity = TDEE" step.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityKey, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

export const ACTIVITY_LABELS: Record<
  ActivityKey,
  { label: string; sub: string }
> = {
  sedentary: {
    label: "Sedentary",
    sub: "Little or no exercise",
  },
  light: {
    label: "Light",
    sub: "Exercise 1–3× / week",
  },
  moderate: {
    label: "Moderate",
    sub: "Exercise 4–5× / week",
  },
  active: {
    label: "Active",
    sub: "Daily exercise or sport",
  },
  very: {
    label: "Very Active",
    sub: "Intense daily training or physical job",
  },
};

export const FORMULA_LABELS: Record<FormulaKey, string> = {
  mifflin: "Mifflin-St Jeor",
  harris: "Revised Harris-Benedict",
  katch: "Katch-McArdle",
};

/* ------------------------------------------------------------------
 * 1. Mifflin-St Jeor (1990) — the modern default.
 *    Male:   10·kg + 6.25·cm − 5·age + 5
 *    Female: 10·kg + 6.25·cm − 5·age − 161
 * The most accurate non-body-composition formula across the
 * published validation studies (±10% for ~70% of adults).
 * ------------------------------------------------------------------ */
export function mifflinStJeor({
  sex,
  weightKg,
  heightCm,
  age,
}: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === "male" ? 5 : -161);
}

/* ------------------------------------------------------------------
 * 2. Revised Harris-Benedict (Roza & Shizgal, 1984).
 *    Male:   88.362 + 13.397·kg + 4.799·cm − 5.677·age
 *    Female: 447.593 + 9.247·kg + 3.098·cm − 4.330·age
 * The legacy default — still common in clinical software,
 * tends to over-estimate by ~5% for modern populations.
 * ------------------------------------------------------------------ */
export function revisedHarrisBenedict({
  sex,
  weightKg,
  heightCm,
  age,
}: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  if (sex === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

/* ------------------------------------------------------------------
 * 3. Katch-McArdle (1996) — lean body mass only.
 *    370 + 21.6 · (weightKg · (1 − bodyFatPct/100))
 *    Most accurate when body-fat % is known, because it
 *    ignores the (metabolically inactive) fat mass entirely.
 * ------------------------------------------------------------------ */
export function katchMcArdle({
  weightKg,
  bodyFatPct,
}: {
  weightKg: number;
  bodyFatPct: number;
}): number {
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * leanMassKg;
}

/* ------------------------------------------------------------------
 * BMR → TDEE: multiply by the activity factor. Rounded to the
 * nearest whole kcal so the output matches the rest of the
 * CalStory tracker.
 * ------------------------------------------------------------------ */
export function tdeeFromBmr(bmr: number, activity: ActivityKey): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
}

/* ------------------------------------------------------------------
 * Cut/bulk targets. The calculator surfaces four of these
 * (mild cut, standard cut, mild bulk, standard bulk) plus the
 * maintenance number itself.
 *
 * The numbers come from the same ±250 / ±500 kcal bands the
 * prompt calls out — a 250 kcal daily gap ≈ 0.5 lb / week, a
 * 500 kcal gap ≈ 1 lb / week, in either direction.
 * ------------------------------------------------------------------ */
export const CALORIE_TARGETS = {
  maintenance: 0,
  mildCut: -250,
  standardCut: -500,
  mildBulk: 250,
  standardBulk: 500,
} as const;

export type CalorieTargetKey = keyof typeof CALORIE_TARGETS;

export function calorieTarget(tdee: number, key: CalorieTargetKey): number {
  return Math.max(0, tdee + CALORIE_TARGETS[key]);
}

/* ------------------------------------------------------------------
 * kcal ↔ kJ. 1 kcal = 4.184 kJ exactly (the international
 * thermochemical calorie definition).
 * ------------------------------------------------------------------ */
export const KCAL_PER_KJ = 1 / 4.184;

export function kcalToKj(kcal: number): number {
  return Math.round(kcal * 4.184);
}

export function kjToKcal(kj: number): number {
  return Math.round(kj * KCAL_PER_KJ);
}

/* ------------------------------------------------------------------
 * Inputs are clamped to the prompt's domain:
 *   • Age 15..80
 *   • Body-fat 5..50% (Katch-McArdle only)
 * Outside these ranges the formulas behave badly (Mifflin was
 * derived on adults aged 19–78; Katch needs a sane lean mass
 * estimate). Clamping keeps the on-page error message off the
 * critical path for typos.
 * ------------------------------------------------------------------ */
export const AGE_MIN = 15;
export const AGE_MAX = 80;
export const BODY_FAT_MIN = 5;
export const BODY_FAT_MAX = 50;

export function clampAge(age: number): number {
  if (!Number.isFinite(age)) return AGE_MIN;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(age)));
}

export function clampBodyFat(pct: number): number {
  if (!Number.isFinite(pct)) return BODY_FAT_MIN;
  return Math.min(BODY_FAT_MAX, Math.max(BODY_FAT_MIN, pct));
}

/* ------------------------------------------------------------------
 * Convenience: dispatch the right BMR formula from the key
 * selected in the UI. Returns BMR in kcal/day, rounded to the
 * nearest whole number for display.
 * ------------------------------------------------------------------ */
export function computeBmr(args: {
  formula: FormulaKey;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  bodyFatPct?: number;
}): number {
  const age = clampAge(args.age);
  let raw: number;
  switch (args.formula) {
    case "mifflin":
      raw = mifflinStJeor({
        sex: args.sex,
        weightKg: args.weightKg,
        heightCm: args.heightCm,
        age,
      });
      break;
    case "harris":
      raw = revisedHarrisBenedict({
        sex: args.sex,
        weightKg: args.weightKg,
        heightCm: args.heightCm,
        age,
      });
      break;
    case "katch":
      raw = katchMcArdle({
        weightKg: args.weightKg,
        bodyFatPct: clampBodyFat(args.bodyFatPct ?? 20),
      });
      break;
  }
  return Math.round(raw);
}
