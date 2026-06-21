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
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const timeframes = ["This wk", "Last wk", "2 wk ago", "3 wk ago"];

export function DailyAverageCalories() {
  const { state } = useApp();
  const [activeFrame, setActiveFrame] = useState("This wk");

  const meals = state?.meals || {};

  const chartData = useMemo<ChartData<"bar">>(() => {
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

    const proteinData = days.map((d) => {
      const dayMeals = meals[d.key] || [];
      return dayMeals.reduce((sum, m) => sum + (m.p || 0), 0);
    });
    const carbsData = days.map((d) => {
      const dayMeals = meals[d.key] || [];
      return dayMeals.reduce((sum, m) => sum + (m.c || 0), 0);
    });
    const fatData = days.map((d) => {
      const dayMeals = meals[d.key] || [];
      return dayMeals.reduce((sum, m) => sum + (m.f || 0), 0);
    });

    return {
      labels: days.map((d) => d.label),
      datasets: [
        {
          label: "Protein",
          data: proteinData,
          backgroundColor: "#EF4444",
          stack: "Stack 0",
          borderRadius: {
            topLeft: 0,
            topRight: 0,
            bottomLeft: 4,
            bottomRight: 4,
          },
        },
        {
          label: "Carbs",
          data: carbsData,
          backgroundColor: "#00E676",
          stack: "Stack 0",
        },
        {
          label: "Fat",
          data: fatData,
          backgroundColor: "#FFEA00",
          stack: "Stack 0",
          borderRadius: {
            topLeft: 4,
            topRight: 4,
            bottomLeft: 0,
            bottomRight: 0,
          },
        },
      ],
    };
  }, [activeFrame, meals]);

  const chartOptions: ChartOptions<"bar"> = {
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
        stacked: true,
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
        stacked: true,
        ticks: {
          font: { family: "DM Mono", size: 11 },
          color: "rgba(155, 152, 149, 0.6)",
        },
      },
    },
  };

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 m-5">
          <CardTitle className="text-base font-bold shrink-0">
            Daily Average Calories
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
        <div className="h-56 w-full relative mb-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="flex justify-center items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-xs font-semibold text-[#9B9895]">
              Protein
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
            <span className="text-xs font-semibold text-[#9B9895]">Carbs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFEA00]" />
            <span className="text-xs font-semibold text-[#9B9895]">Fat</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
