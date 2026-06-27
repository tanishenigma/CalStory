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

    // "All Time" mirrors the WeightChanges row: compare the average of
    // every logged day against the average of the prior N logged days
    // (where N = number of logged days). This gives a real delta when
    // the user has at least 2 days of data, and degrades to "--" when
    // there isn't enough history to split in half.
    const calculateAllTime = () => {
      const allDates = Object.keys(meals)
        .filter((k) => meals[k] && meals[k].length > 0)
        .sort(); // ascending; YYYY-MM-DD sorts chronologically
      if (allDates.length < 2) {
        return { label: "All Time", value: "--", isPositive: true };
      }
      const mid = Math.floor(allDates.length / 2);
      const recentSlice = allDates.slice(mid);
      const previousSlice = allDates.slice(0, mid);

      const avg = (slice: string[]) => {
        const total = slice.reduce(
          (s, k) => s + meals[k].reduce((sm, m) => sm + (m.cal || 0), 0),
          0,
        );
        return total / slice.length;
      };

      const recentAvg = avg(recentSlice);
      const previousAvg = avg(previousSlice);
      const diff = Math.round(recentAvg - previousAvg);
      return {
        label: "All Time",
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
      calculateAllTime(),
    ];
  }, [meals]);

  return (
    <div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground">
            Expenditure Changes
          </h3>
        </div>
        <div className="divide-y divide-border divide-border">
          {expenditureChanges.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 m-1">
              <span className="text-md font-medium text-foreground">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-mono font-semibold ${item.isPositive ? "text-muted-foreground" : "text-destructive"}`}>
                  {item.value}
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
