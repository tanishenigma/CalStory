/**
 * Pure unit conversion for the Calorie Calculator tool.
 *
 * Imperial conversions (kg ↔ lbs, cm ↔ ft+in) are re-exported
 * from `app/lib/units.ts` so the tool and the onboarding form
 * agree on every display number. The kcal ↔ kJ conversion is
 * specific to this tool — it isn't used anywhere else in
 * CalStory, so it lives here.
 */

export {
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm,
  cmToFtInParts,
} from "@/app/lib/units";

import { kcalToKj, kjToKcal } from "./bmr";

/** Convert any kcal value to kJ, rounded to a whole number. */
export const toEnergy = (kcal: number, unit: "kcal" | "kj"): number =>
  unit === "kj" ? kcalToKj(kcal) : Math.round(kcal);

/** Inverse of `toEnergy` — kJ back to kcal when the user reads
 *  results in kJ and wants the kcal equivalent (used by the
 *  kcal/kJ toggle in the calculator). */
export const fromEnergy = (value: number, unit: "kcal" | "kj"): number =>
  unit === "kj" ? kjToKcal(value) : Math.round(value);
