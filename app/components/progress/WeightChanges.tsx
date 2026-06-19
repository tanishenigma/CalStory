"use client";

import { ChevronRight } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { kgToLbs } from "@/app/lib/units";
import type { WeightLog } from "@/app/types";

interface DeltaRow {
  label: string;
  /** `null` means "not enough data to compute a delta". */
  delta: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Find the weight log closest to a given target date. We pick the
 * nearest one (in either direction) so a missing entry on exactly
 * day -7 still resolves to the closest actual weigh-in. `null` if
 * no log exists in the lookback window at all.
 *
 * Comparison is done against `log.date` (parsed at local noon) rather
 * than `loggedAt` so backdated entries are matched by their intended
 * calendar date, not when they were physically saved.
 */
function nearestLog(
  logs: WeightLog[],
  target: number,
  windowMs: number,
): WeightLog | null {
  if (!logs.length) return null;
  let best: WeightLog | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const l of logs) {
    // Use the intended date at local noon to match calendar-day intent
    const dateMs = new Date(l.date + "T12:00:00").getTime();
    const diff = Math.abs(dateMs - target);
    if (diff <= windowMs && diff < bestDiff) {
      best = l;
      bestDiff = diff;
    }
  }
  return best;
}

export default function WeightChanges() {
  const { state } = useApp();
  const profile = state?.profile;
  const logs = state?.weightLogs ?? [];

  // Always work in the user's display unit so the deltas line up
  // with what they see elsewhere (chart, profile card, edit modal).
  const displayUnit = profile?.weightUnit ?? "kg";
  const toDisplay = (kg: number) => (displayUnit === "lbs" ? kgToLbs(kg) : kg);

  // "Current" weight is the most-recent log if any exist — that's
  // what `logWeight` mirrors onto `profile.weight` already, so
  // they're guaranteed to agree. Fall back to the profile value
  // when there are no logs yet.
  const latest = logs[0];
  const currentWeightKg = latest ? latest.weight : (profile?.weight ?? 0);

  // For each window, look back from the most-recent log (not from
  // `now`) — that way a one-week-old log still gets a real delta
  // instead of showing "—". We also widen the search window to 3
  // days so a 7-day delta still resolves if the user logged a day
  // or two late.
  const referenceAt = latest ? latest.loggedAt : Date.now();

  const compute = (days: number): number | null => {
    if (!latest) return null;
    const target = referenceAt - days * DAY_MS;
    const past = nearestLog(logs, target, 3 * DAY_MS);
    if (!past) return null;
    return toDisplay(currentWeightKg) - toDisplay(past.weight);
  };

  // For "All time" we use the oldest log as the comparison — no
  // fixed lookback. This shows total change since the user started
  // tracking.
  const allTimeDelta = (() => {
    if (!latest || logs.length < 2) return null;
    // `logs` is sorted newest-first, so the oldest entry is at the end.
    const oldest = logs[logs.length - 1];
    return toDisplay(currentWeightKg) - toDisplay(oldest.weight);
  })();

  const rows: DeltaRow[] = [
    { label: "3 day", delta: compute(3) },
    { label: "7 day", delta: compute(7) },
    { label: "14 day", delta: compute(14) },
    { label: "30 day", delta: compute(30) },
    { label: "90 day", delta: compute(90) },
    { label: "All Time", delta: allTimeDelta },
  ];

  return (
    <div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden ">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
            Weight Changes
          </h3>
        </div>
        <div className="divide-y divide-[#E8E7E4] dark:divide-[#3a3a3a]">
          {rows.map((item, idx) => {
            // Color rules:
            //   - null  → muted ("no data yet")
            //   - 0     → muted (no change)
            //   - sign depends on the user's goal. `cut` wants loss
            //     (negative), `bulk` wants gain (positive), `maintain`
            //     shows neutral. We just show a sign-coloured value;
            //     treating any movement as noteworthy beats hiding it.
            const signClass =
              item.delta === null || item.delta === 0
                ? "text-[#9B9895]"
                : item.delta < 0
                  ? "text-[#22C55E]"
                  : "text-[#F97316]";
            const formatted =
              item.delta === null
                ? "—"
                : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)} ${displayUnit}`;
            return (
              <div
                key={idx}
                className="flex justify-between items-center p-4 m-1">
                <span className="text-md font-medium text-[#1A1916] dark:text-[#f7f6f3]">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-semibold ${signClass}`}>
                    {formatted}
                  </span>
                  <ChevronRight size={16} className="text-[#9B9895]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
