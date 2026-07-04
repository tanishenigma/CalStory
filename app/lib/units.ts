import type {
  WeightUnit,
  HeightUnit,
  GoalKey,
  IntensityKey,
  VolumeUnit,
} from "@/app/types";

// Unit conversion helpers
export const kgToLbs = (kg: number): number =>
  Math.round(kg * 2.20462 * 10) / 10;
export const lbsToKg = (lbs: number): number =>
  Math.round((lbs / 2.20462) * 10) / 10;
export const cmToFtIn = (cm: number): string => {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return `${ft}'${inches}"'`;
};
export const ftInToCm = (ft: number, inches: number): number =>
  Math.round((ft * 12 + inches) * 2.54);

/**
 * Split a height in cm into separate `feet` and `inches` numbers
 * (each rounded to an integer) so the imperial height input can
 * pre-fill with sensible values. `Math.round` on the inches part
 * matches the rounding used by `cmToFtIn`, so the round-trip
 * stays lossless for display purposes.
 */
export function cmToFtInParts(cm: number): { feet: number; inches: number } {
  const totalIn = cm / 2.54;
  const feet = Math.floor(totalIn / 12);
  // Use 2 decimals on the inches so we don't round-up into a
  // new foot (e.g. 5'11.6" stays 5'11", not 6'0"). The number
  // input on the UI accepts the decimal and shows it.
  const inches = Math.round((totalIn % 12) * 10) / 10;
  return { feet, inches };
}

export function displayWeight(kg: number, unit: WeightUnit): string {
  if (unit === "lbs") return `${kgToLbs(kg)} lbs`;
  return `${kg} kg`;
}

export function displayHeight(cm: number, unit: HeightUnit): string {
  if (unit === "imperial") return cmToFtIn(cm);
  return `${cm} cm`;
}

// TDEE percentage multipliers for cut/bulk intensity (applied to TDEE)
// e.g. 0.91 = mild cut at 91% of TDEE, 0.81 = weightloss at 81%, 0.63 = extreme at 63%
export const INTENSITY_ADJ: Record<IntensityKey, Record<GoalKey, number>> = {
  mildCut: { cut: 0.91, maintain: 1.0, bulk: 1.05 },
  weightloss: { cut: 0.81, maintain: 1.0, bulk: 1.1 },
  extremeCut: { cut: 0.63, maintain: 1.0, bulk: 1.15 },
};

// ── Volume conversions ────────────────────────────────────────
// Values are always stored internally in ml. Display helpers
// reformat live based on the user's chosen VolumeUnit setting.
const ML_PER_FLOZ = 29.5735;

/** Convert millilitres to US fluid ounces, rounded to 1 decimal. */
export const mlToFloz = (ml: number): number =>
  Math.round((ml / ML_PER_FLOZ) * 10) / 10;

/** Convert US fluid ounces to millilitres, rounded to nearest integer. */
export const flozToMl = (floz: number): number =>
  Math.round(floz * ML_PER_FLOZ);

/**
 * Format a ml quantity for display in the user's preferred unit.
 * Returns a string like "250 ml", "8.5 fl oz", "1.5 L", etc.
 */
export function displayVolume(ml: number, unit: VolumeUnit = "ml"): string {
  if (unit === "floz") return `${mlToFloz(ml)} fl oz`;
  // For ml, show as litres when ≥ 1000 ml to keep numbers readable.
  if (ml >= 1000) return `${Math.round((ml / 1000) * 10) / 10} L`;
  return `${ml} ml`;
}
