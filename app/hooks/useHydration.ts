"use client";

/**
 * useHydration — derives hydration display state from today's
 * HydrationLog and the user's volumeUnit preference.
 *
 * All values are stored internally in ml. This hook converts for display
 * only, so the underlying data layer remains unit-agnostic.
 */

import { useMemo } from "react";
import { displayVolume } from "@/app/lib/units";
import type { HydrationLog, VolumeUnit } from "@/app/types";

export const DEFAULT_GOAL_ML = 2500;

export interface HydrationState {
  totalMl: number;
  goalMl: number;
  /** 0 – 1, clamped */
  pct: number;
  entries: HydrationLog["entries"];
  totalLabel: string;
  goalLabel: string;
  /** True when the user has met or exceeded their daily goal. */
  goalReached: boolean;
}

export function useHydration(
  log: HydrationLog | null,
  volumeUnit: VolumeUnit = "ml",
): HydrationState {
  return useMemo(() => {
    const goalMl = log?.goalMl ?? DEFAULT_GOAL_ML;
    const entries = log?.entries ?? [];
    const totalMl = entries.reduce((sum, e) => sum + e.ml, 0);
    const pct = Math.min(1, totalMl / goalMl);

    return {
      totalMl,
      goalMl,
      pct,
      entries,
      totalLabel: displayVolume(totalMl, volumeUnit),
      goalLabel: displayVolume(goalMl, volumeUnit),
      goalReached: totalMl >= goalMl,
    };
  }, [log, volumeUnit]);
}
