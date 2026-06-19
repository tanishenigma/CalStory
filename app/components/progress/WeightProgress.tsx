"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";
import { kgToLbs } from "@/app/lib/units";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const timeframes = ["This wk", "1M", "1Y", "All"] as const;
type Timeframe = (typeof timeframes)[number];

/** Number of days covered by each timeframe. `Infinity` for "All". */
const TF_DAYS: Record<Timeframe, number> = {
  "This wk": 7,
  "1M": 30,
  "1Y": 365,
  All: Number.POSITIVE_INFINITY,
};

/**
 * Filter logs to those within the last `days` of today, then sort
 * oldest → newest so the line chart reads left-to-right correctly.
 * If there are no logs in the window we fall back to the most
 * recent log so the chart is never empty (just a flat dot).
 */
function logsForTimeframe(
  logs: ReturnType<typeof useApp>["state"]["weightLogs"],
  days: number,
) {
  if (!logs.length) return [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const inWindow = logs.filter((l) => l.loggedAt >= cutoff);
  const source = inWindow.length ? inWindow : [logs[logs.length - 1]];
  // Sort by the user-chosen date (YYYY-MM-DD) so backdated entries
  // still appear in chronological order on the chart, regardless of
  // when the log was actually saved (loggedAt).
  return [...source].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Exponential moving average over a series of values.
 *
 * Why EMA instead of a simple moving average? Daily weigh-ins are
 * noisy — water, food timing, sleep, stress. EMA gives more weight
 * to recent days, so a 1-2 day spike doesn't yank the trend around.
 *
 * `alpha` is the smoothing factor. α = 2/(N+1) where N ≈ window
 * size in days. α=0.3 ≈ 5-6 day half-life, which feels right for
 * weight: long enough to absorb noise, short enough to actually
 * reflect a real week of eating.
 *
 * Returns an array of the same length as the input. The first
 * value is seeded with the first input (no warm-up window).
 */
function ema(values: number[], alpha = 0.3): number[] {
  if (!values.length) return [];
  const out = new Array<number>(values.length);
  out[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    out[i] = alpha * values[i] + (1 - alpha) * out[i - 1];
  }
  return out;
}

/**
 * Linear-regression slope of (x, y) pairs, returning dy per 1 unit
 * of x. We feed it integer day indices so the slope is naturally
 * in "weight units per day" — callers multiply by 7 for per-week.
 */
function slopePerUnit(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Heuristic target weight for the progress bar. We don't have a
 * stored "goal weight" field on the profile (only `cut | maintain |
 * bulk`), so we derive a sensible default from the user's start
 * weight: -10% for cut, +10% for bulk, no bar for maintain. This
 * keeps the bar meaningful out of the box without requiring
 * settings work.
 */
function heuristicTarget(
  startKg: number,
  goal: "cut" | "maintain" | "bulk" | undefined,
): number | null {
  if (!goal || goal === "maintain") return null;
  return goal === "cut" ? startKg * 0.9 : startKg * 1.1;
}

export function WeightProgress() {
  const { state } = useApp();
  const [activeFrame, setActiveFrame] = useState<Timeframe>("1M");
  const profile = state?.profile;

  let currentWeight = 0;
  let displayUnit = "kg";
  let goalLabel = "—";

  if (profile) {
    displayUnit = profile.weightUnit === "lbs" ? "lbs" : "kg";
    currentWeight =
      profile.weightUnit === "lbs" ? kgToLbs(profile.weight) : profile.weight;
    goalLabel = profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1);
  }

  // Always pull the *full* history for trend & progress calculations,
  // regardless of the active timeframe — the user's "start" weight
  // is the oldest log, not the oldest in the current window. The
  // chart itself can still slice to the window.
  const weightLogs = state?.weightLogs ?? [];
  const allSorted = useMemo(
    () => [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [weightLogs],
  );

  const toDisplay = (kg: number) => (displayUnit === "lbs" ? kgToLbs(kg) : kg);

  // ── Trend + stats (computed on full history) ──────────────────
  const trend = useMemo(() => {
    if (!allSorted.length)
      return { raw: [] as number[], smoothed: [] as number[] };
    const raw = allSorted.map((l) => toDisplay(l.weight));
    const smoothed = ema(raw, 0.3);
    return { raw, smoothed };
  }, [allSorted, displayUnit]);

  // Slope is kg/week, computed on the last 30 trend points. We use
  // a fixed window (not the active timeframe) so the rate doesn't
  // bounce around when the user switches timeframes.
  const ratePerWeek = useMemo(() => {
    const window = trend.smoothed.slice(-30);
    return slopePerUnit(window) * 7;
  }, [trend.smoothed]);

  // Progress bar math. Start = oldest log. Current = latest trend
  // (smoother reading than a single day's noisy value). Target =
  // heuristic from goal.
  const progress = useMemo(() => {
    if (!allSorted.length) {
      return { start: 0, current: 0, target: 0, pct: 0, hasTarget: false };
    }
    const start = toDisplay(allSorted[0].weight);
    const current = trend.smoothed[trend.smoothed.length - 1] ?? start;
    const targetRawKg = heuristicTarget(allSorted[0].weight, profile?.goal);
    const target = targetRawKg === null ? 0 : toDisplay(targetRawKg);

    if (targetRawKg === null) {
      // Maintain — no numeric target. Show a muted bar at 100% so
      // the layout doesn't shift, but suppress the "X% Complete"
      // copy which would be misleading.
      return {
        start,
        current,
        target: current,
        pct: 100,
        hasTarget: false,
      };
    }

    // pct is direction-aware: for a cut, progress = how far from
    // start toward target. For a bulk, same idea but reversed.
    // We clamp 0..100.
    const totalSpan = target - start; // negative for cut, positive for bulk
    const covered = current - start;
    const pct = totalSpan === 0 ? 0 : (covered / totalSpan) * 100;
    return {
      start,
      current,
      target,
      pct: Math.max(0, Math.min(100, pct)),
      hasTarget: true,
    };
  }, [allSorted, trend.smoothed, displayUnit, profile?.goal]);

  // ── Chart data (sliced to active window) ──────────────────────
  const chartData = useMemo<ChartData<"line">>(() => {
    const days = TF_DAYS[activeFrame];
    const inWindow = logsForTimeframe(weightLogs, days);
    // We need the EMA points that line up with `inWindow`. Easiest
    // way: recompute EMA on the in-window series (visually identical
    // for short windows, and the chart's "trend" is window-local).
    const rawWindow = inWindow.map((l) => toDisplay(l.weight));
    const trendWindow = ema(rawWindow, 0.3);
    const labels = inWindow.map((l) => {
      const d = new Date(l.date + "T12:00:00");
      return activeFrame === "1Y" || activeFrame === "All"
        ? d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
        : d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    });
    return {
      labels,
      datasets: [
        {
          // Faded raw line so the user can see the noise — it
          // reinforces why a trend is useful.
          label: "Daily",
          data: rawWindow,
          borderColor: "rgba(155, 152, 149, 0.5)",
          backgroundColor: "rgba(155, 152, 149, 0.5)",
          borderWidth: 1.5,
          borderDash: [3, 3],
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: "#9B9895",
          fill: false,
          order: 2,
        },
        {
          // The bold trend line — the one to actually trust.
          label: "Trend",
          data: trendWindow,
          borderColor: "#F97316",
          backgroundColor: "rgba(249, 115, 22, 0.12)",
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: "#F97316",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          fill: true,
          order: 1,
        },
      ],
    };
  }, [weightLogs, activeFrame, displayUnit]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A1916",
        titleFont: { family: "DM Mono", size: 11 },
        bodyFont: { family: "DM Mono", size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v === null || v === undefined) return "";
            return `${ctx.dataset.label}: ${v.toFixed(1)} ${displayUnit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "Inter", size: 11 },
          color: "rgba(155, 152, 149, 0.6)",
        },
      },
      y: {
        // Subtle gridline that works on both light and dark cards.
        // Earlier this was a hard-coded light hex (#F0EFEC) which
        // read as stark white in dark mode and fought the data.
        grid: { color: "rgba(155, 152, 149, 0.15)" },
        ticks: {
          font: { family: "DM Mono", size: 11 },
          color: "rgba(155, 152, 149, 0.6)",
        },
      },
    },
  };

  const isEmpty = (chartData.labels?.length ?? 0) === 0;
  const trendCurrent = trend.smoothed[trend.smoothed.length - 1];

  // Rate copy: ↓ Losing X kg/wk / ↑ Gaining X kg/wk / Stable.
  // Threshold 0.1 kg/wk = "stable" because daily noise is bigger
  // than that, so smaller movements shouldn't be over-interpreted.
  const rateAbs = Math.abs(ratePerWeek);
  const rateDirection: "lose" | "gain" | "stable" =
    rateAbs < 0.1 ? "stable" : ratePerWeek < 0 ? "lose" : "gain";
  const rateText = (() => {
    if (rateDirection === "stable") return "Stable";
    const verb = rateDirection === "lose" ? "Losing" : "Gaining";
    return `${verb} ${rateAbs.toFixed(1)} kg/wk`;
  })();
  const RateIcon =
    rateDirection === "lose"
      ? TrendingDown
      : rateDirection === "gain"
        ? TrendingUp
        : Minus;
  const rateColorClass =
    rateDirection === "lose"
      ? "text-[#22C55E]"
      : rateDirection === "gain"
        ? "text-[#F97316]"
        : "text-[#9B9895]";

  // Progress-bar fill color reflects direction:
  //   cut losing weight = on-track (green)
  //   bulk gaining weight = on-track (green)
  //   moving away from goal = orange
  //   maintain (no target) = muted
  const barFillClass = (() => {
    if (!progress.hasTarget) return "bg-[#9B9895]";
    const movingToward =
      (profile?.goal === "cut" && ratePerWeek < 0) ||
      (profile?.goal === "bulk" && ratePerWeek > 0);
    if (rateDirection === "stable") return "bg-[#9B9895]";
    return movingToward ? "bg-[#22C55E]" : "bg-[#F97316]";
  })();

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4 min-w-0 m-5">
          <CardTitle className="text-base font-bold shrink-0">
            Weight Progress
          </CardTitle>
          <div className="flex bg-background p-1 rounded-lg shrink-0">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveFrame(tf)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeFrame === tf
                    ? "bg-card text-[#1A1916] dark:text-[#f7f6f3] shadow-sm"
                    : "text-[#9B9895]"
                }`}>
                {tf}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="h-48 w-full relative mb-4">
          {isEmpty ? (
            <div className="h-full w-full flex items-center justify-center text-sm text-[#9B9895] text-center px-6">
              Log a weight to start tracking your progress.
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Current + Trend + Rate */}
        <div className="flex justify-between items-end border-t border-border pt-4 mb-4">
          <div className="flex gap-6">
            <div>
              <div className="text-[11px] font-bold text-[#9B9895] mb-1 uppercase tracking-wider">
                Current
              </div>
              <div className="text-2xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3]">
                {currentWeight > 0 ? currentWeight.toFixed(1) : "—"}{" "}
                <span className="text-sm font-sans font-medium text-[#9B9895]">
                  {displayUnit}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#9B9895] mb-1 uppercase tracking-wider">
                Trend
              </div>
              <div className="text-2xl font-mono font-bold text-[#F97316]">
                {trendCurrent !== undefined ? trendCurrent.toFixed(1) : "—"}{" "}
                <span className="text-sm font-sans font-medium text-[#9B9895]">
                  {displayUnit}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-1.5 text-sm font-semibold ${rateColorClass}`}>
              <RateIcon size={14} />
              {rateText}
            </div>
            <div className="text-[11px] text-[#9B9895] mt-1">
              Goal: {goalLabel}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!isEmpty && (
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#9B9895] mb-1.5 uppercase tracking-wider">
              <span>
                Start: {progress.start.toFixed(1)} {displayUnit}
              </span>
              <span>
                {progress.hasTarget
                  ? `Goal: ${progress.target.toFixed(1)} ${displayUnit}`
                  : "Maintain"}
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-[#E8E7E4] dark:bg-[#3a3a3a] overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${barFillClass} rounded-full transition-[width] duration-500`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <div className="text-[11px] text-[#9B9895]">
                Current:{" "}
                <span className="font-mono font-semibold text-[#1A1916] dark:text-[#f7f6f3]">
                  {progress.current.toFixed(1)} {displayUnit}
                </span>
              </div>
              {progress.hasTarget ? (
                <div className="text-[11px] font-semibold text-[#1A1916] dark:text-[#f7f6f3]">
                  {progress.pct.toFixed(0)}% Complete
                </div>
              ) : (
                <div className="text-[11px] text-[#9B9895]">
                  Keep logging to see your trend
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
