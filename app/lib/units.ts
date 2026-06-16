import type { WeightUnit, HeightUnit, GoalKey, IntensityKey } from '@/app/types';

// Unit conversion helpers
export const kgToLbs  = (kg: number): number  => Math.round(kg  * 2.20462 * 10) / 10;
export const lbsToKg  = (lbs: number): number => Math.round(lbs / 2.20462 * 10) / 10;
export const cmToFtIn = (cm: number): string  => {
  const totalIn = cm / 2.54;
  const ft      = Math.floor(totalIn / 12);
  const inches  = Math.round(totalIn % 12);
  return `${ft}'${inches}"'`;
};
export const ftInToCm = (ft: number, inches: number): number =>
  Math.round((ft * 12 + inches) * 2.54);

export function displayWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lbs') return `${kgToLbs(kg)} lbs`;
  return `${kg} kg`;
}

export function displayHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'imperial') return cmToFtIn(cm);
  return `${cm} cm`;
}

// TDEE adjustment multipliers for cut/bulk intensity
export const INTENSITY_ADJ: Record<IntensityKey, Record<GoalKey, number>> = {
  slow:       { cut: -150, maintain: 0, bulk: +150 },
  moderate:   { cut: -300, maintain: 0, bulk: +300 },
  aggressive: { cut: -500, maintain: 0, bulk: +500 },
};
