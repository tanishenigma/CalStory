"use client";

import React, { useState, useMemo, useRef } from "react";
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
  const fullLabelsRef = useRef<string[]>([]);

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
        fullLabel: d.toLocaleDateString("en-IN", { weekday: "long" }),
        key,
      };
    });

    fullLabelsRef.current = days.map((d) => d.fullLabel);

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
          backgroundColor: "#f0583c",
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
          backgroundColor: "#ef974a",
          stack: "Stack 0",
        },
        {
          label: "Fat",
          data: fatData,
          backgroundColor: "#f4d25e",
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
        backgroundColor: "var(--color-ink)",
        titleFont: { family: "DM Mono", size: 11 },
        bodyFont: { family: "DM Mono", size: 13 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            return fullLabelsRef.current[idx] || "";
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        stacked: true,
        ticks: {
          font: { family: "Inter", size: 11 },
          color: "oklch(0.5517 0.0138 285.9385 / 0.6)",
        },
      },
      y: {
        grid: { color: "oklch(0.5517 0.0138 285.9385 / 0.15)" },
        stacked: true,
        ticks: {
          font: { family: "DM Mono", size: 11 },
          color: "oklch(0.5517 0.0138 285.9385 / 0.6)",
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
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
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
            <div className="w-2.5 h-2.5 rounded-full bg-[#f0583c]" />
            <span className="text-xs font-semibold text-muted-foreground">
              Protein
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef974a]" />
            <span className="text-xs font-semibold text-muted-foreground">
              Carbs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f4d25e]" />
            <span className="text-xs font-semibold text-muted-foreground">
              Fat
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
