import type { TDEEInput, TDEEResult } from "@/app/types";
import { INTENSITY_ADJ } from "@/app/lib/units";

// ─── Goal-based macro density (g per kg of macro weight) ───
const PROTEIN_PER_KG: Record<string, number> = {
  cut: 2.0,
  bulk: 1.8,
  maintain: 1.8,
};

const FAT_PER_KG: Record<string, number> = {
  cut: 0.8,
  bulk: 1.0,
  maintain: 0.9,
};

/**
 * Derive a TDEE activity multiplier from steps-per-day and
 * workouts-per-week — substantially more accurate than a
 * subjective dropdown because it reflects total daily energy.
 */
export function getActivityMultiplier(
  steps: number,
  workoutsPerWeek: number,
): number {
  if (steps < 5000 && workoutsPerWeek === 0) return 1.2;
  if (steps < 7500 && workoutsPerWeek <= 3) return 1.375;
  if (steps < 10000 && workoutsPerWeek <= 5) return 1.55;
  if (steps < 15000 && workoutsPerWeek <= 6) return 1.725;
  return 1.9;
}

/**
 * Mifflin–St Jeor BMR → TDEE → calorie target → macro split
 *
 * Steps:
 *  1. BMR from height, weight, age, sex
 *  2. TDEE = BMR × activity multiplier (derived from steps + workouts)
 *  3. Calorie target = TDEE ± intensity-based adjustment
 *  4. Macro weight = BMI > 30 ? adjusted weight (BMI-30 cap) : actual weight
 *  5. Protein = round(macroWeight × proteinPerKg)
 *  6. Fat    = round(macroWeight × fatPerKg)
 *  7. Carbs  = round((calTarget − protein×4 − fat×9) / 4)
 *
 * The weekly weight-trend recalibration (Step 9) is handled separately
 * by `recalibrateTDEE()` which adjusts `calTarget` by ±100 kcal when
 * actual weight change diverges from the expected rate.
 */
export function calcTDEE(profile: TDEEInput): TDEEResult {
  const {
    gender,
    weight,
    height,
    age,
    steps,
    workoutsPerWeek,
    goal,
    intensity,
  } = profile;

  // Step 1: BMR (Mifflin–St Jeor)
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  // Step 2: TDEE
  const factor = getActivityMultiplier(steps, workoutsPerWeek);
  const tdee = Math.round(bmr * factor);

  // Step 3: Calorie target (goal + intensity multiplier)
  const multiplier =
    goal !== "maintain" && intensity
      ? (INTENSITY_ADJ[intensity]?.[goal] ?? 1.0)
      : 1.0;
  const calTarget = Math.max(Math.round(tdee * multiplier), 1200);

  // Step 4: BMI-based macro weight
  const bmi = weight / Math.pow(height / 100, 2);
  const macroWeight = bmi > 30 ? 25 * Math.pow(height / 100, 2) : weight;

  // Step 5: Protein
  const proteinPerKg = PROTEIN_PER_KG[goal] ?? 1.8;
  const protein = Math.round(macroWeight * proteinPerKg);

  // Step 6: Fat
  const fatPerKg = FAT_PER_KG[goal] ?? 0.9;
  const fat = Math.round(macroWeight * fatPerKg);

  // Step 7: Carbs (remaining calories after protein + fat)
  const carbs = Math.round(Math.max(calTarget - protein * 4 - fat * 9, 0) / 4);

  return { tdee, calTarget, protein, fat, carbs };
}

/**
 * Weekly recalibration: compare actual vs expected weight change and
 * nudge calTarget by ±100 kcal to correct drift.
 *
 * Call this after at least 2 weeks of logged weights.
 *
 * @param currentCalTarget  The user's current calTarget
 * @param expectedWeeklyChange  Expected weekly weight change in kg (+ = bulk, − = cut)
 * @param actualWeeklyChange    Actual observed weekly weight change in kg
 * @returns Adjusted calTarget (unchanged if drift is within ±0.1 kg)
 */
export function recalibrateTDEE(
  currentCalTarget: number,
  expectedWeeklyChange: number,
  actualWeeklyChange: number,
): number {
  const drift = actualWeeklyChange - expectedWeeklyChange;
  if (Math.abs(drift) < 0.1) return currentCalTarget; // within tolerance
  // If losing less than expected (or gaining less), increase calories slightly
  // If losing more than expected (or gaining more), decrease calories slightly
  return currentCalTarget + (drift > 0 ? -100 : +100);
}
