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

    // A day counts only if at least one meal was actually saved on that date
    // (not backdated). Meals without savedDate are old data — count them as valid.
    const hasMeals = (meals[key] ?? []).some(
      (m) => !m.savedDate || m.savedDate === key,
    );

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
      isActive: (meals[key] ?? []).some(
        (m) => !m.savedDate || m.savedDate === key,
      ),
    };
  });

  return (
    <div className="mb-6 ">
      <Card className="p-4 w-full overflow-hidden bg-card">
        <CardContent className="p-0 flex flex-col justify-between h-full min-w-0 bg-card">
          <div className="relative flex flex-col h-full min-w-0 ">
            <div className="text-[13px] font-bold text-muted-foreground p-4 pb-0">
              Day streak
            </div>
            <div className="p-4 pt-2">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-sans text-foreground">
                {currentStreak}
              </span>
            </div>
            <Flame
              className="absolute right-[-8px] sm:right-[-12px] lg:right-[-16px] top-1/2 -translate-y-1/2 text-primary w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
              fill="var(--color-primary)"
            />
          </div>

          <div className="flex justify-between items-center mt-auto max-w-xs">
            {last7Days.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-6">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {item.dayStr}
                </span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-primary" : "bg-muted"}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
