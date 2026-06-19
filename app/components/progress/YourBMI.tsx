"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";
import { Scale, Info } from "lucide-react";

/* ─────────────────────────────────────────────
   BMI CATEGORIES (WHO classification)
   ───────────────────────────────────────────── */

type Category = {
  min: number;
  max: number;
  label: string;
  color: string;
  textColor: string;
};

const CATEGORIES: Category[] = [
  {
    min: 0,
    max: 16.5,
    label: "Severely underweight",
    color: "#93C5FD",
    textColor: "#1D4ED8",
  },
  {
    min: 16.5,
    max: 18.5,
    label: "Underweight",
    color: "#60A5FA",
    textColor: "#1D4ED8",
  },
  {
    min: 18.5,
    max: 25,
    label: "Healthy",
    color: "#22C55E",
    textColor: "#15803D",
  },
  {
    min: 25,
    max: 30,
    label: "Overweight",
    color: "#F97316",
    textColor: "#9A3412",
  },
  {
    min: 30,
    max: 35,
    label: "Obese (I)",
    color: "#EF4444",
    textColor: "#991B1B",
  },
  {
    min: 35,
    max: 40,
    label: "Obese (II)",
    color: "#DC2626",
    textColor: "#7F1D1D",
  },
  {
    min: 40,
    max: Infinity,
    label: "Obese (III)",
    color: "#991B1B",
    textColor: "#7F1D1D",
  },
];

/** Map a BMI value to its category. Returns the first bucket
 * whose range contains the value. */
function categoryFor(bmi: number): Category {
  return (
    CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export function YourBMI() {
  const { state } = useApp();
  const profile = state?.profile;

  let bmiValue = 0;
  if (profile && profile.weight && profile.height) {
    const heightInMeters = profile.height / 100;
    bmiValue = profile.weight / (heightInMeters * heightInMeters);
  } else if (profile) {
    bmiValue = 22.0;
  }

  const hasData = bmiValue > 0;
  const current = categoryFor(bmiValue);

  const minBmi = 15;
  const maxBmi = 40;
  const percentage = Math.min(
    Math.max(((bmiValue - minBmi) / (maxBmi - minBmi)) * 100, 0),
    100,
  );

  const currentIdx = CATEGORIES.indexOf(current);
  const nextCategory =
    currentIdx < CATEGORIES.length - 1 ? CATEGORIES[currentIdx + 1] : null;
  const distanceToNext = nextCategory
    ? Math.max(0, nextCategory.min - bmiValue)
    : null;

  // Calculate the gradient stops based on the midpoint of each category
  const gradientStops = CATEGORIES.map((c) => {
    const lo = Math.max(c.min, minBmi);
    const hi = Math.min(c.max, maxBmi);
    const mid = (lo + hi) / 2;
    const pct = ((mid - minBmi) / (maxBmi - minBmi)) * 100;
    return `${c.color} ${pct}%`;
  }).join(", ");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 p-5">
          <CardTitle className="text-lg">Your BMI</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {/* Headline row: big BMI value + status pill. */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <div className="text-[10px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Body Mass Index
            </div>
            <div className="text-4xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3] leading-none">
              {hasData ? bmiValue.toFixed(1) : "—"}
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${current.color}22`,
              color: current.textColor,
            }}>
            {hasData ? current.label : "Unknown"}
          </div>
        </div>

        <div className="relative">
          {/* Faded/overlapping continuous gradient bar */}
          <div
            className="relative w-full h-3 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(to right, ${gradientStops})`,
            }}
          />

          {hasData && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-card border-2 rounded-full shadow-md transition-all duration-500"
              style={{
                left: `calc(${percentage}% - 10px)`,
                borderColor: current.textColor,
              }}>
              {/* Tiny inner dot in the band color reinforces the
                  "you are here" reading at a glance. */}
              <div
                className="absolute inset-1 rounded-full"
                style={{ backgroundColor: current.color }}
              />
            </div>
          )}

          {[16.5, 18.5, 25, 30, 35, 40].map((cut) => {
            const tickPct = ((cut - minBmi) / (maxBmi - minBmi)) * 100;
            return (
              <div
                key={cut}
                className="absolute top-0 bottom-0 w-px pointer-events-none"
                style={{ left: `${tickPct}%` }}
                aria-hidden
              />
            );
          })}
        </div>

        {/* Boundary labels — only show values at category edges so
            the row below the bar isn't cluttered with 15 numbers. */}
        <div className="relative w-full h-4 mt-1.5 text-[9px] font-mono font-semibold text-[#9B9895]">
          {[16.5, 18.5, 25, 30, 35].map((cut) => {
            const tickPct = ((cut - minBmi) / (maxBmi - minBmi)) * 100;
            return (
              <span
                key={cut}
                className="absolute -translate-x-1/2"
                style={{ left: `${tickPct}%` }}>
                {cut}
              </span>
            );
          })}
        </div>

        {/* "You are here" callout */}
        {hasData &&
          distanceToNext !== null &&
          nextCategory &&
          distanceToNext > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-background/50 border border-border/60 px-3 py-2.5">
              <Info size={14} className="text-[#9B9895] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#1A1916] dark:text-[#f7f6f3] leading-relaxed">
                <span className="font-semibold">
                  {distanceToNext.toFixed(1)} BMI points
                </span>{" "}
                to <span className="font-semibold">{nextCategory.label}</span>
                {current.label === "Overweight" && " (a healthier zone)"}
                {current.label === "Underweight" && " (a healthier zone)"}
                {current.label.startsWith("Obese") && " (a healthier zone)"}.
              </p>
            </div>
          )}

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CATEGORIES.map((c, i) => {
            const isCurrent = i === currentIdx;
            return (
              <div
                key={c.label}
                className={`flex items-center gap-1.5   rounded-md text-xs ${
                  isCurrent
                    ? "bg-foreground/[0.04] w-fit pr-2 border border-border"
                    : "border border-transparent"
                }`}>
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span
                  className={`truncate ${
                    isCurrent
                      ? "font-bold text-foreground"
                      : "text-[#9B9895] font-medium"
                  }`}>
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
