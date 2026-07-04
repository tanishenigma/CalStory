"use client";

/**
 * useFitnessAutoSync — page-mount + visibilitychange sync hook.
 *
 * Drives the Google Fit sync cadence on every page that opts in
 * (Fitness, Progress). Errors are silently swallowed here — the
 * FitnessClient page surfaces detailed errors via `useFitnessStore`.
 */

import { useEffect, useRef } from "react";
import { todayLocalKey } from "@/app/context/AppContext";
import { hasValidToken, getFitnessData } from "@/app/lib/google-fit";
import type { FitnessLog } from "@/app/types";

interface UseFitnessAutoSyncOptions {
  /** Called once per successful sync with the resolved log. */
  onSync?: (log: FitnessLog) => void;
  /** Disable the hook (e.g. when user is not signed in). */
  enabled?: boolean;
}

export function useFitnessAutoSync(
  options: UseFitnessAutoSyncOptions = {},
): void {
  const { onSync, enabled = true } = options;
  const lastSyncedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const sync = async (): Promise<void> => {
      // Throttle: don't fire more than once per 30 s. Avoids a burst
      // of tabs triggering N parallel syncs in quick succession
      // (focus loop, double tab, etc.).
      if (Date.now() - lastSyncedAtRef.current < 30_000) return;
      lastSyncedAtRef.current = Date.now();

      const date = todayLocalKey();
      if (!hasValidToken()) return;

      const res = await getFitnessData(date);
      if (res.ok && res.log) onSync?.(res.log);
    };

    // Initial sync on mount
    void sync();

    const onVisibility = (): void => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = window.setInterval(
      () => {
        if (document.visibilityState === "visible") void sync();
      },
      30 * 60 * 1000,
    ); // 30 min

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
