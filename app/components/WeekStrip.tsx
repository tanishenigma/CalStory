"use client";

import { useState, useEffect } from "react";
import { useApp, todayKey } from "@/app/context/AppContext";
import { DAY_LABELS } from "@/app/lib/constants";
import DatePicker from "@/app/components/DatePicker";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useStreak } from "@/app/hooks/useStreak";

/**
 * Returns the 7 days of the week containing `baseDateStr` + weekOffset, starting from
 * Monday.
 */
function getMondayWeek(baseDateStr: string, offsetWeeks: number = 0): Date[] {
  const [year, month, day] = baseDateStr.split("-").map(Number);
  const baseDate = new Date(year, month - 1, day, 12, 0, 0);

  const dow = (baseDate.getDay() + 6) % 7;
  const mon = new Date(baseDate);
  mon.setDate(baseDate.getDate() - dow + (offsetWeeks * 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

export default function WeekStrip() {
  const { state, setDate } = useApp();
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const streak = useStreak();
  const today = todayKey();

  useEffect(() => {
    setWeekOffset(0);
  }, [state.selDate]);

  const days = getMondayWeek(state.selDate, weekOffset);

  const lastDayKey = `${days[6].getFullYear()}-${String(days[6].getMonth() + 1).padStart(2, "0")}-${String(days[6].getDate()).padStart(2, "0")}`;
  const disableNextWeek = lastDayKey >= today;

  const hasLoggedToday = 
    (state.meals[today] || []).length > 0 ||
    (state.workouts[today] || []).length > 0;

  return (
    <>
      <div className="flex justify-between mb-6 items-center w-full">

        {/* Left Side: Nav, Strip, Calendar */}
        <div className="flex items-center w-2/3 gap-2 overflow-x-auto hide-scrollbar">

          {/* Navigation Chevrons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-10 h-10 rounded-xl border border-[#E8E7E4] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1916] flex items-center justify-center text-[#9B9895] hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] transition-colors cursor-pointer shadow-sm"
              title="Previous week"
              aria-label="Previous week">
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={disableNextWeek}
              className="w-10 h-10 rounded-xl border border-[#E8E7E4] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1916] flex items-center justify-center text-[#9B9895] hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next week"
              aria-label="Next week">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days Strip */}
          <div className="flex gap-1.5 flex-1 max-w-lg mx-auto">
            {days.map((d, i) => {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const isFuture = key > today;
              const isToday = key === today;
              const isSel = key === state.selDate && !isToday;
              const hasData =
                (state.meals[key] || []).length > 0 ||
                (state.workouts[key] || []).length > 0;

              return (
                <button
                  key={key}
                  onClick={() => setDate(key)}
                  disabled={isFuture}
                  aria-pressed={key === state.selDate}
                  className={[
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-full transition-all duration-150 border-2 min-w-[36px]",
                    isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer",
                    isToday && "bg-[#1A1916] dark:bg-[#f7f6f3] ",
                    isSel && !isToday && "border-black border-dotted bg-foreground/5",
                    !isSel && "border-transparent",
                    !isToday && !isSel && !isFuture && "bg-transparent hover:bg-foreground/20 opacity-40",
                  ]
                    .filter(Boolean)
                    .join(" ")}>
                  <span
                    className={[
                      "text-[9px] font-bold tracking-wider uppercase",
                      isToday ? "text-white dark:text-[#1a1916]" : "text-[#9B9895]",
                    ].join(" ")}>
                    {DAY_LABELS[i]}
                  </span>
                  <span
                    className={[
                      "font-mono text-sm font-semibold",
                      isToday ? "text-white dark:text-[#1a1916]" : "text-[#1A1916] dark:text-[#f7f6f3]",
                    ].join(" ")}>
                    {d.getDate()}
                  </span>
                  <span
                    className={[
                      "w-1 h-1 rounded-full bg-[#22C55E] transition-opacity duration-200 mt-0.5",
                      hasData ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>

          {/* Calendar button */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-10 h-10 rounded-xl flex-shrink-0 border border-[#E8E7E4] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1916] flex items-center justify-center text-[#9B9895] hover:bg-[#F7F6F3] dark:hover:bg-[#0f0f0e] transition-colors cursor-pointer shadow-sm"
            title="Pick any date"
            aria-label="Pick any date">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>

        {/* Right Side: Streak Box */}
        <div className="flex-shrink-0 ml-2">
          <div className="flex items-center justify-center gap-1.5 px-2.5 h-14 w-14 rounded-full border border-[#E8E7E4] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1916] shadow-md">
            <Flame size={20} className={hasLoggedToday ? "text-[#F97316]" : "text-[#9B9895]"} fill={hasLoggedToday ? "#F97316" : "#E8E7E4"} />
            <span className="font-mono text-lg font-bold text-[#1A1916] dark:text-[#f7f6f3]">{streak}</span>
          </div>
        </div>

      </div>

      {showPicker && <DatePicker onClose={() => setShowPicker(false)} />}
    </>
  );
}
