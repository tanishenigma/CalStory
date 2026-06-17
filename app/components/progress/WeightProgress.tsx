"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
);

const timeframes = ["This wk", "1M", "1Y", "All"];

export function WeightProgress() {
  const { state } = useApp();
  const [activeFrame, setActiveFrame] = useState("1M");
  const profile = state?.profile;

  let currentWeight = 0;
  let displayUnit = "kg";
  let goalWeightStr = "—";

  if (profile) {
    displayUnit = profile.weightUnit === "lbs" ? "lbs" : "kg";
    currentWeight =
      profile.weightUnit === "lbs" ? profile.weight * 2.20462 : profile.weight;
    goalWeightStr =
      profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1);
  }

  const chartData = useMemo<ChartData<"line">>(() => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      dates.push(
        d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      );
    }
    const dataPoints = dates.map(() => currentWeight);
    return {
      labels: dates,
      datasets: [
        {
          data: dataPoints,
          borderColor: "#1A1916",
          backgroundColor: "#1A1916",
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#F97316",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [currentWeight]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A1916",
        titleFont: { family: "DM Mono", size: 11 },
        bodyFont: { family: "DM Mono", size: 13 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter", size: 11 }, color: "#9B9895" },
      },
      y: {
        grid: { color: "#F0EFEC" },
        ticks: { font: { family: "DM Mono", size: 11 }, color: "#9B9895" },
      },
    },
  };

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
        <div className="h-48 w-full relative mb-6">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="flex justify-between items-end border-t border-border pt-4">
          <div>
            <div className="text-[13px] font-bold text-[#9B9895] mb-1">
              Current weight
            </div>
            <div className="text-3xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {currentWeight > 0 ? currentWeight.toFixed(1) : "—"}{" "}
              <span className="text-lg font-sans font-medium text-[#9B9895]">
                {displayUnit}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#1A1916] dark:text-[#f7f6f3]">
              Goal: {goalWeightStr}
            </div>
            <div className="text-[11px] text-[#9B9895] mt-1">
              {chartData.labels && chartData.labels.length > 0
                ? `${chartData.labels[0]} - ${chartData.labels[chartData.labels.length - 1]}`
                : ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
