import type {
  WeightUnit,
  HeightUnit,
  GoalKey,
  IntensityKey,
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

// TDEE adjustment multipliers for cut/bulk intensity
export const INTENSITY_ADJ: Record<IntensityKey, Record<GoalKey, number>> = {
  slow: { cut: -150, maintain: 0, bulk: +150 },
  moderate: { cut: -300, maintain: 0, bulk: +300 },
  aggressive: { cut: -500, maintain: 0, bulk: +500 },
};
