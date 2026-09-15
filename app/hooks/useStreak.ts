"use client";

import { useMemo } from "react";
import { useApp } from "@/app/context/AppContext";

export function useStreak() {
  const { state } = useApp();
  const meals = state?.meals || {};
  const hydrationLog = state?.hydrationLog;
  const hydrationLogs = state?.hydrationLogs || {};

  return useMemo(() => {
    let currentStreak = 0;
    const todayDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      const hasMeals = Boolean(meals[key]?.length);
      const waterForDay = hydrationLogs[key] ?? (hydrationLog?.date === key ? hydrationLog : null);
      const hasWater = Boolean(waterForDay?.entries.length);
      const isActive = hasMeals || hasWater;
      
      if (i === 0 && !isActive) {
         continue;
      }
      if (isActive) {
         currentStreak++;
      } else {
         break;
      }
    }
    return currentStreak;
  }, [meals, hydrationLog, hydrationLogs]);
}
