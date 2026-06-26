// Shared types for the Settings tab components.
// Tab + intensity helpers that were previously inlined in SettingsClient.

import type { GoalKey, IntensityKey } from "@/app/types";

export type Tab = "profile" | "goals" | "appearance" | "units" | "ai";

export interface IntensityOption {
  key: IntensityKey;
  pct: string;
}

export const INTENSITIES: IntensityOption[] = [
  { key: "mildCut", pct: "9%" },
  { key: "weightloss", pct: "19%" },
  { key: "extremeCut", pct: "37%" },
];

export function getIntensityLabel(
  key: string,
  goal: GoalKey,
): { label: string; desc: string } {
  if (goal === "bulk") {
    const bulkMap: Record<string, { label: string; desc: string }> = {
      mildCut: { label: "Mild Bulk", desc: "105% of TDEE — slow, clean gains" },
      weightloss: {
        label: "Weight Gain",
        desc: "110% of TDEE — steady muscle building",
      },
      extremeCut: {
        label: "Extreme Bulk",
        desc: "115% of TDEE — aggressive bulk",
      },
    };
    return bulkMap[key] ?? { label: key, desc: "" };
  }
  const cutMap: Record<string, { label: string; desc: string }> = {
    mildCut: {
      label: "Mild Cut",
      desc: "91% of TDEE — gentle deficit, very sustainable",
    },
    weightloss: {
      label: "Weight Loss",
      desc: "81% of TDEE — standard deficit, balanced approach",
    },
    extremeCut: {
      label: "Extreme Cut",
      desc: "63% of TDEE — aggressive deficit, rapid results",
    },
  };
  return cutMap[key] ?? { label: key, desc: "" };
}
