// filepath: app/lib/bulkMacros.ts
import type { BulkMacroInput, BulkMacroResult } from "@/app/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const KCAL_PER_PROTEIN = 4;
const KCAL_PER_FAT = 9;
const DEFAULT_SURPLUS = 0.09; // mild bulk: +9% TDEE
const WARNING_SURPLUS = 0.1; // flag surplus > +10%

const DEFAULT_PROTEIN_PER_KG = 2.2; // g/kg bodyweight
const MIN_PROTEIN_PER_KG = 2.0; // floor — never drop below this
const DEFAULT_FAT_PER_KG = 1.0; // g/kg bodyweight
const MIN_FAT_PER_KG = 0.8; // floor

// ─── Input validation helpers ────────────────────────────────────────────────
function validateInputs(weight: number, tdee: number): void {
  if (weight <= 0) throw new Error("weight must be a positive number");
  if (tdee <= 0) throw new Error("tdee must be a positive number");
}

/**
 * Calculate macro split for a bulking phase.
 *
 * Priority order:
 *  1. Protein  — 2.2 g/kg bodyweight (floor: 2.0 g/kg)
 *  2. Fat      — 1.0 g/kg bodyweight (floor: 0.8 g/kg)
 *  3. Carbs    — remainder calories after protein + fat
 *
 * Default mild bulk is +9% TDEE (105% TDEE total).
 * Surplus > 10% triggers a warning flag.
 */
export function calculateBulkMacros(input: BulkMacroInput): BulkMacroResult {
  const {
    weight,
    tdee,
    surplus = DEFAULT_SURPLUS,
    proteinPerKg = DEFAULT_PROTEIN_PER_KG,
    fatPerKg = DEFAULT_FAT_PER_KG,
  } = input;

  validateInputs(weight, tdee);

  // Clamp to floors
  const effectiveProteinPerKg = Math.max(proteinPerKg, MIN_PROTEIN_PER_KG);
  const effectiveFatPerKg = Math.max(fatPerKg, MIN_FAT_PER_KG);

  // Total calorie target with surplus
  const totalCalories = Math.round(tdee * (1 + surplus));

  // Protein & fat in grams
  const protein = Math.round(weight * effectiveProteinPerKg);
  const fat = Math.round(weight * effectiveFatPerKg);

  // Remaining calories → carbs (floor to avoid rounding up and overshooting)
  const proteinCals = protein * KCAL_PER_PROTEIN;
  const fatCals = fat * KCAL_PER_FAT;
  const carbCals = Math.max(totalCalories - proteinCals - fatCals, 0);
  const carbs = Math.floor(carbCals / KCAL_PER_PROTEIN);

  // Warnings
  const warnings: string[] = [];
  if (surplus > WARNING_SURPLUS && surplus <= 0.2) {
    warnings.push(
      `Surplus of ${Math.round(surplus * 100)}% may increase fat gain risk. Consider a milder bulk.`,
    );
  } else if (surplus > 0.2) {
    warnings.push(
      `Aggressive bulk: ${Math.round(surplus * 100)}% surplus — high risk of excess fat gain.`,
    );
  }

  return {
    totalCalories,
    protein,
    fat,
    carbs,
    warnings,
  };
}
