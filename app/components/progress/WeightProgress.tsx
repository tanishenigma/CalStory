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

const timeframes = ["1W", "1M", "1Y", "All"] as const;
type Timeframe = (typeof timeframes)[number];

const TF_DAYS: Record<Timeframe, number> = {
  "1W": 7,
  "1M": 30,
  "1Y": 365,
  All: Number.POSITIVE_INFINITY,
};

const TF_LABEL: Record<Timeframe, string> = {
  "1W": "1W",
  "1M": "1M",
  "1Y": "1Y",
  All: "All",
};

function logsForTimeframe(
  logs: ReturnType<typeof useApp>["state"]["weightLogs"],
  days: number,
) {
  if (!logs.length) return [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const inWindow = logs.filter((l) => l.loggedAt >= cutoff);
  const source = inWindow.length ? inWindow : [logs[logs.length - 1]];
  return [...source].sort((a, b) => a.date.localeCompare(b.date));
}

function ema(values: number[], alpha = 0.3): number[] {
  if (!values.length) return [];
  const out = new Array<number>(values.length);
  out[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    out[i] = alpha * values[i] + (1 - alpha) * out[i - 1];
  }
  return out;
}

function slopePerUnit(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
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

  const displayUnit = profile?.weightUnit === "lbs" ? "lbs" : "kg";

  const toDisplay = (kg: number) => (displayUnit === "lbs" ? kgToLbs(kg) : kg);

  let currentWeight = 0;
  let goalLabel = "—";

  if (profile) {
    currentWeight = toDisplay(profile.weight);
    goalLabel = profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1);
  }

  const weightLogs = state?.weightLogs ?? [];
  const allSorted = useMemo(
    () => [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [weightLogs],
  );

  const trend = useMemo(() => {
    if (!allSorted.length)
      return { raw: [] as number[], smoothed: [] as number[] };
    const raw = allSorted.map((l) => toDisplay(l.weight));
    const smoothed = ema(raw, 0.3);
    return { raw, smoothed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSorted, displayUnit]);

  const ratePerWeek = useMemo(() => {
    const window = trend.smoothed.slice(-30);
    return slopePerUnit(window) * 7;
  }, [trend.smoothed]);

  const progress = useMemo(() => {
    if (!allSorted.length) {
      return { start: 0, current: 0, target: 0, pct: 0, hasTarget: false };
    }
    const start = toDisplay(allSorted[0].weight);
    const current = trend.smoothed[trend.smoothed.length - 1] ?? start;
    const targetRawKg = heuristicTarget(allSorted[0].weight, profile?.goal);
    const target = targetRawKg === null ? 0 : toDisplay(targetRawKg);

    if (targetRawKg === null) {
      return { start, current, target: current, pct: 100, hasTarget: false };
    }

    const totalSpan = target - start;
    const covered = current - start;
    const pct = totalSpan === 0 ? 0 : (covered / totalSpan) * 100;
    return {
      start,
      current,
      target,
      pct: Math.max(0, Math.min(100, pct)),
      hasTarget: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSorted, trend.smoothed, displayUnit, profile?.goal]);

  const chartData = useMemo<ChartData<"line">>(() => {
    const days = TF_DAYS[activeFrame];
    const inWindow = logsForTimeframe(weightLogs, days);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const rateAbs = Math.abs(ratePerWeek);
  const rateDirection: "lose" | "gain" | "stable" =
    rateAbs < 0.1 ? "stable" : ratePerWeek < 0 ? "lose" : "gain";
  const rateText = (() => {
    if (rateDirection === "stable") return "Stable";
    const verb = rateDirection === "lose" ? "Losing" : "Gaining";
    return `${verb} ${rateAbs.toFixed(1)} ${displayUnit}/wk`;
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 m-5">
          <CardTitle className="text-base font-bold shrink-0">
            Weight Progress
          </CardTitle>
          <div className="flex bg-background p-1 rounded-lg shrink-0 overflow-x-auto no-scrollbar">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveFrame(tf)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeFrame === tf
                    ? "bg-card text-[#1A1916] dark:text-[#f7f6f3] shadow-sm"
                    : "text-[#9B9895]"
                }`}>
                {TF_LABEL[tf]}
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

        <div className="flex flex-wrap justify-between items-end gap-y-3 border-t border-border pt-4 mb-4">
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
