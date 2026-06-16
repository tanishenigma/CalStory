"use client";

import { useMemo } from "react";
import { useApp } from "@/app/context/AppContext";

export function useStreak() {
  const { state } = useApp();
  const meals = state?.meals || {};

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

      const hasMeals = meals[key] && meals[key].length > 0;
      
      if (i === 0 && !hasMeals) {
         continue;
      }
      if (hasMeals) {
         currentStreak++;
      } else {
         break;
      }
    }
    return currentStreak;
  }, [meals]);
}
