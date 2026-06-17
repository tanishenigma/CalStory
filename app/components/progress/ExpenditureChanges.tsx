"use client";

import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useApp } from "@/app/context/AppContext";

export function ExpenditureChanges() {
  const { state } = useApp();
  const meals = state?.meals || {};

  const expenditureChanges = useMemo(() => {
    const today = new Date();

    // Helper to get average calories for a specific past window
    const getAvgCal = (daysAgoStart: number, daysAgoEnd: number) => {
      let total = 0;
      let count = 0;
      for (let i = daysAgoStart; i <= daysAgoEnd; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = `${year}-${month}-${day}`;

        if (meals[key]) {
          total += meals[key].reduce((sum, m) => sum + (m.cal || 0), 0);
          count++;
        }
      }
      return count > 0 ? total / count : null;
    };

    // Calculate changes comparing recent window vs previous window of same size
    const calculateChange = (days: number) => {
      const recentAvg = getAvgCal(0, days - 1);
      const previousAvg = getAvgCal(days, days * 2 - 1);

      if (recentAvg === null || previousAvg === null) {
        return { label: `${days} day`, value: "--", isPositive: true };
      }

      const diff = Math.round(recentAvg - previousAvg);
      return {
        label: `${days} day`,
        value: `${diff > 0 ? "+" : ""}${diff} kcal`,
        isPositive: diff >= 0,
      };
    };

    return [
      calculateChange(3),
      calculateChange(7),
      calculateChange(14),
      calculateChange(30),
      calculateChange(90),
    ];
  }, [meals]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-bold text-[#1A1916] dark:text-[#f7f6f3] ">
          Expenditure Changes
        </h3>
      </div>
      <div className="divide-y divide-[#E8E7E4] dark:divide-[#3a3a3a]">
        {expenditureChanges.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-3">
            <span className="text-sm font-medium text-[#1A1916] dark:text-[#f7f6f3]">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-mono font-semibold ${item.isPositive ? "text-[#9B9895]" : "text-[#EF4444]"}`}>
                {item.value}
              </span>
              <ChevronRight size={16} className="text-[#9B9895]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
