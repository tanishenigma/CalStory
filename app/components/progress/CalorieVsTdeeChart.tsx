"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayEntry {
  date: string; // "Apr 6"
  intake: number; // kcal
  tdee: number; // kcal
}

interface Props {
  data: DayEntry[];
  /** ISO date string where TDEE algorithm reset / weight changed notably */
  tdeeResetDate?: string;
}

// ─── Summary Row ─────────────────────────────────────────────────────────────

function SummaryRow({ data }: { data: DayEntry[] }) {
  const avg = (key: keyof DayEntry) =>
    data.length > 0
      ? Math.round(
          data.reduce((s, d) => s + (d[key] as number), 0) / data.length,
        )
      : 0;

  const avgIntake = avg("intake");
  const avgTdee = avg("tdee");
  const avgDeficit = avgTdee - avgIntake;

  const stats = [
    {
      label: "Avg Intake",
      value: `${avgIntake.toLocaleString()} kcal`,
      color: "text-orange-400",
    },
    {
      label: "Avg TDEE",
      value: `${avgTdee.toLocaleString()} kcal`,
      color: "text-emerald-400",
    },
    {
      label: avgDeficit >= 0 ? "Avg Deficit" : "Avg Surplus",
      value: `${Math.abs(avgDeficit).toLocaleString()} kcal`,
      color: avgDeficit >= 0 ? "text-sky-400" : "text-rose-400",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg bg-muted/50 px-3 py-2 text-center">
          <p className="text-[11px] text-muted-foreground">{s.label}</p>
          <p className={`mt-0.5 text-sm font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Chart ───────────────────────────────────────────────────────────────

export function CalorieVsTdeeChart({
  data,
  tdeeResetDate: _tdeeResetDate,
}: Props) {
  // tdeeResetDate available for future reference line feature
  const chartData = useMemo<ChartData<"line">>(() => {
    return {
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "Calorie Intake",
          data: data.map((d) => d.intake),
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#f97316",
          pointHoverBorderWidth: 0,
        },
        {
          label: "Adaptive TDEE",
          data: data.map((d) => d.tdee),
          borderColor: "#34d399",
          backgroundColor: "rgba(52, 211, 153, 0.1)",
          fill: true,
          tension: 0.4,
          borderDash: [6, 3],
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#34d399",
          pointHoverBorderWidth: 0,
        },
      ],
    };
  }, [data]);

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "top" as const,
          align: "end" as const,
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            borderRadius: 4,
            useBorderRadius: true,
            color: "rgba(155,152,149,0.8)",
            font: {
              size: 11,
            },
          },
        },
        tooltip: {
          backgroundColor: (context) =>
            document.documentElement.classList.contains("dark")
              ? "#1A1916"
              : "#ffffff",
          titleColor: (context) =>
            document.documentElement.classList.contains("dark")
              ? "rgba(255,255,255,0.8)"
              : "rgba(30,30,30,0.9)",
          titleFont: { family: "DM Mono", size: 11 },
          bodyColor: (context) =>
            document.documentElement.classList.contains("dark")
              ? "rgba(255,255,255,0.7)"
              : "rgba(30,30,30,0.8)",
          bodyFont: { family: "DM Mono", size: 13 },
          padding: 10,
          cornerRadius: 8,
          borderColor: (context) =>
            document.documentElement.classList.contains("dark")
              ? "rgba(255,255,255,0.1)"
              : "rgba(155,152,149,0.2)",
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ?? "";
              const value = context.parsed.y?.toLocaleString() ?? "0";
              return ` ${label}: ${value} kcal`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: (context) =>
              document.documentElement.classList.contains("dark")
                ? "rgba(255,255,255,0.35)"
                : "rgba(155,152,149,0.6)",
            font: {
              size: 11,
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          grid: {
            color: (context) =>
              document.documentElement.classList.contains("dark")
                ? "rgba(255,255,255,0.06)"
                : "rgba(155,152,149,0.15)",
          },
          ticks: {
            color: (context) =>
              document.documentElement.classList.contains("dark")
                ? "rgba(255,255,255,0.35)"
                : "rgba(155,152,149,0.6)",
            font: {
              size: 11,
            },
            callback: (value) => `${((value as number) / 1000).toFixed(1)}k`,
          },
          border: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="p-5 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border">
        <CardTitle className="text-base font-bold shrink-0">
          Calorie Intake vs Adaptive TDEE
        </CardTitle>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Daily intake vs maintenance calories · last {data.length} days
        </p>
      </CardHeader>
      <CardContent className="px-5 py-2">
        <div className="h-56 w-full relative ">
          <Line data={chartData} options={options} />
        </div>
        <SummaryRow data={data} />
        <p className="pt-5 text-xs text-center text-muted-foreground font-bold font-sans">
          To Lose weight, eat below the green line!
        </p>
      </CardContent>
    </Card>
  );
}
