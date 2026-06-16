"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";

export function YourBMI() {
  const { state } = useApp();
  const profile = state?.profile;

  // Calculate BMI
  let bmiValue = 0;
  if (profile && profile.weight && profile.height) {
    const heightInMeters = profile.height / 100;
    bmiValue = profile.weight / (heightInMeters * heightInMeters);
  } else {
    // Fallback if no profile is loaded
    bmiValue = 24.3;
  }

  // Determine status
  let bmiStatus = "Healthy";
  let statusColor = "#22C55E"; // Green

  if (bmiValue < 18.5) {
    bmiStatus = "Underweight";
    statusColor = "#60A5FA"; // Blue
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiStatus = "Overweight";
    statusColor = "#F97316"; // Orange
  } else if (bmiValue >= 30) {
    bmiStatus = "Obese";
    statusColor = "#EF4444"; // Red
  }

  // Calculate percentage for slider position
  const minBmi = 15;
  const maxBmi = 40;
  const percentage = Math.min(Math.max(((bmiValue - minBmi) / (maxBmi - minBmi)) * 100, 0), 100);

  return (
    <Card className="overflow-hidden">
      <CardTitle className="text-lg p-4">Your BMI</CardTitle>
      <CardContent className="p-6">
        <div className="flex justify-between items-end mb-6">
          <div className="text-4xl font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3]">
            {bmiValue > 0 ? bmiValue.toFixed(1) : "—"}
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${statusColor}22`, color: statusColor }}
          >
            {bmiValue > 0 ? bmiStatus : "Unknown"}
          </div>
        </div>

        {/* Slider Track */}
        <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 mb-2">
          {/* Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#1A1916] dark:border-[#f7f6f3] rounded-full shadow-sm transition-all duration-500"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-bold text-[#9B9895] uppercase tracking-wider">
          <span>Underweight</span>
          <span>Obese</span>
        </div>
      </CardContent>
    </Card>
  );
}
