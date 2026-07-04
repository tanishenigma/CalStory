"use client";

/**
 * useFastingTimer — derives live elapsed / remaining time from a
 * FastingSession using UTC millisecond arithmetic only.
 *
 * DST / timezone safety: elapsed = Date.now() - startUtcMs.
 * We never do local-hour subtraction, so clocks springing forward
 * or backward have zero effect on the displayed duration.
 */

import { useEffect, useState } from "react";
import type { FastingSession } from "@/app/types";

export interface FastingTimerState {
  elapsedMs: number;
  remainingMs: number;
  /** 0 – 1, clamped */
  progress: number;
  isComplete: boolean;
  elapsedLabel: string;
  remainingLabel: string;
  targetLabel: string;
}

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function computeState(session: FastingSession | null): FastingTimerState {
  if (!session || session.status !== "active") {
    return {
      elapsedMs: 0,
      remainingMs: session?.targetDurationMs ?? 0,
      progress: 0,
      isComplete: session?.status === "completed",
      elapsedLabel: "0m 00s",
      remainingLabel: formatDuration(session?.targetDurationMs ?? 0),
      targetLabel: formatDuration(session?.targetDurationMs ?? 0),
    };
  }

  const now = Date.now();
  const elapsedMs = now - session.startUtcMs;
  const remainingMs = Math.max(0, session.targetDurationMs - elapsedMs);
  const progress = Math.min(1, elapsedMs / session.targetDurationMs);
  const isComplete = elapsedMs >= session.targetDurationMs;

  return {
    elapsedMs,
    remainingMs,
    progress,
    isComplete,
    elapsedLabel: formatDuration(elapsedMs),
    remainingLabel: formatDuration(remainingMs),
    targetLabel: formatDuration(session.targetDurationMs),
  };
}

export function useFastingTimer(
  session: FastingSession | null,
): FastingTimerState {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    // Tick every second so the timer label updates smoothly.
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  // Re-compute on every tick (or when session changes).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return computeState(session);
}
