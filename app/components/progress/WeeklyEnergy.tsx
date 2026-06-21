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

const timeframes = ["This wk", "Last wk", "2 wk ago", "3 wk ago"];

export function WeeklyEnergy() {
  const { state } = useApp();
  const [activeFrame, setActiveFrame] = useState("This wk");

  const meals = state?.meals || {};
  const workouts = state?.workouts || {};

  const chartData = useMemo(() => {
    let offsetWeeks = 0;
    if (activeFrame === "Last wk") offsetWeeks = 1;
    if (activeFrame === "2 wk ago") offsetWeeks = 2;
    if (activeFrame === "3 wk ago") offsetWeeks = 3;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i) - offsetWeeks * 7);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
      return {
        label: d.toLocaleDateString("en-IN", { weekday: "short" }).charAt(0),
        key,
      };
    });

    const consumedData = days.map((d) => {
      const dayMeals = meals[d.key] || [];
      return dayMeals.reduce((sum, m) => sum + (m.cal || 0), 0);
    });
    const burnedData = days.map((d) => {
      const dayWorkouts = workouts[d.key] || [];
      return dayWorkouts.reduce((sum, w) => sum + (w.duration || 0) * 6, 0);
    });

    const totalConsumed = consumedData.reduce((a, b) => a + b, 0);
    const totalBurned = burnedData.reduce((a, b) => a + b, 0);
    const avgConsumed = Math.round(totalConsumed / 7);
    const avgBurned = Math.round(totalBurned / 7);
    const avgEnergy = avgConsumed - avgBurned;

    return {
      avgConsumed,
      avgBurned,
      avgEnergy,
      chart: {
        labels: days.map((d) => d.label),
        datasets: [
          {
            label: "Consumed",
            data: consumedData,
            borderColor: "#1A1916",
            backgroundColor: "#1A1916",
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2,
          },
          {
            label: "Burned",
            data: burnedData,
            borderColor: "#EF4444",
            backgroundColor: "#EF4444",
            tension: 0.4,
            pointRadius: 3,
            borderWidth: 2,
          },
        ],
      } as ChartData<"line">,
    };
  }, [activeFrame, meals, workouts]);

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
        beginAtZero: true,
      },
    },
  };

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border ">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 m-5">
          <CardTitle className="text-2xl font-bold shrink-0">
            Weekly Energy
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
                {tf}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <div className="h-48 w-full relative mb-6">
          <Line data={chartData.chart} options={chartOptions} />
        </div>
        <div className="flex justify-between items-center border-t border-border pt-4 px-2">
          <div className="text-center">
            <div className="text-[11px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Consumed
            </div>
            <div className="text-xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {chartData.avgConsumed}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Burned
            </div>
            <div className="text-xl font-mono font-bold text-[#EF4444]">
              {chartData.avgBurned}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Energy
            </div>
            <div className="text-xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {chartData.avgEnergy}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
