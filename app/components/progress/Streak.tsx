"use client";

import React from "react";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";

export function Streak() {
  const { state } = useApp();
  const meals = state?.meals || {};

  // Calculate streak
  let currentStreak = 0;
  const todayDate = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);

    // Construct local date cleanly to avoid UTC shift
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    const hasMeals = meals[key] && meals[key].length > 0;

    if (i === 0 && !hasMeals) {
      // Today is not logged yet, but streak isn't broken
      continue;
    }
    if (hasMeals) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Get last 7 days for the dots
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    return {
      dayStr: d.toLocaleDateString("en-IN", { weekday: "short" }).charAt(0),
      isActive: meals[key] && meals[key].length > 0,
    };
  });

  return (
    <div className="mb-6">
      <Card className="p-4 w-full overflow-hidden">
        <CardContent className="p-0 flex flex-col justify-between h-full min-w-0">
          <div className="relative flex flex-col h-full min-w-0">
            <div className="text-[13px] font-bold text-[#9B9895] p-4 pb-0">
              Day streak
            </div>
            <div className="p-4 pt-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-sans text-[#1A1916] dark:text-[#f7f6f3]">
                {currentStreak}
              </span>
            </div>
            <Flame
              className="absolute right-[-8px] sm:right-[-12px] lg:right-[-16px] top-1/2 -translate-y-1/2 text-[#F97316] w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
              fill="#F97316"
            />
          </div>

          <div className="flex justify-between items-center mt-auto max-w-xs">
            {last7Days.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-6">
                <span className="text-[10px] font-semibold text-[#9B9895]">
                  {item.dayStr}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-[#F97316]" : "bg-[#E8E7E4]"}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
