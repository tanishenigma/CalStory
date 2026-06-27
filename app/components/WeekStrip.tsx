"use client";

import { useState, useEffect, useRef } from "react";
import { useApp, todayLocalKey } from "@/app/context/AppContext";
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
  mon.setDate(baseDate.getDate() - dow + offsetWeeks * 7);

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
  const stripRef = useRef<HTMLDivElement>(null);

  const streak = useStreak();
  const today = todayLocalKey();

  useEffect(() => {
    setWeekOffset(0);
  }, [state.selDate]);

  // Scroll the day strip to the rightmost end on mount and whenever
  // the selected date or week changes, so the latest dates (today)
  // are always in view instead of being clipped off the right edge.
  // The scroll container is the OUTER flex wrapper (the one with
  // `overflow-x-auto` and a width constraint); the inner day div
  // has `shrink-0` so its children force its natural width, which
  // makes the outer container scrollable.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    // Defer to next frame so layout (and `days` length) is settled.
    const raf = requestAnimationFrame(() => {
      if (stripRef.current) {
        stripRef.current.scrollLeft = stripRef.current.scrollWidth;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [state.selDate, weekOffset]);

  const days = getMondayWeek(state.selDate, weekOffset);

  const lastDayKey = `${days[6].getFullYear()}-${String(days[6].getMonth() + 1).padStart(2, "0")}-${String(days[6].getDate()).padStart(2, "0")}`;
  const disableNextWeek = lastDayKey >= today;

  const hasLoggedToday =
    (state.meals[today] || []).length > 0 ||
    (state.workouts[today] || []).length > 0;

  return (
    <>
      <div className="flex flex-col mb-6 w-full">
        {/* Mobile-only header: logo + streak above the week strip */}
        <div className="lg:hidden flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Flame
                size={18}
                className="text-background fill-background"
              />
            </div>
            <span className="font-heading font-bold text-base text-foreground tracking-tight">
              CalStory
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-2.5 h-14 w-14 rounded-full border border-border bg-card shadow-md mb-2">
            <Flame
              size={20}
              className={hasLoggedToday ? "text-primary" : "text-muted-foreground"}
              fill={hasLoggedToday ? "var(--color-primary)" : "var(--color-border)"}
            />
            <span className="text-xl font-bold text-foreground">{streak}</span>
          </div>
        </div>

        {/* Week Strip row: Nav, Strip, Calendar, (Streak on desktop only) */}
        <div className="flex justify-between lg:justify-around items-center w-full gap-2  ">
          <div
            ref={stripRef}
            className="flex items-center gap-2 lg:gap-3 overflow-x-auto scrollbar-hide   ">
            <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0  ">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-background transition-colors cursor-pointer shadow-sm"
                title="Previous week"
                aria-label="Previous week">
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={disableNextWeek}
                className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-background transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next week"
                aria-label="Next week">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days Strip */}
            {/* Both mobile and desktop: circular buttons, fixed-size */}
            <div className="flex gap-2 lg:gap-3 flex-nowrap shrink-0 items-center ">
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
                      // Base: flex-col centered, transition
                      "flex flex-col items-center justify-center gap-1 transition-all duration-150 border-2 shrink-0 rounded-full p-2",
                      "size-12 lg:size-14",
                      isFuture
                        ? "opacity-20 cursor-not-allowed"
                        : "cursor-pointer",
                      isToday &&
                        "bg-foreground border-transparent",
                      isSel &&
                        !isToday &&
                        "border-black border-dotted bg-foreground/5",
                      !isSel && !isToday && "border-transparent",
                      !isToday &&
                        !isSel &&
                        !isFuture &&
                        "bg-transparent hover:bg-foreground/20 opacity-40",
                    ]
                      .filter(Boolean)
                      .join(" ")}>
                    <span
                      className={[
                        "text-[10px] font-bold tracking-wider uppercase leading-none",
                        isToday
                          ? "text-background"
                          : "text-muted-foreground",
                      ].join(" ")}>
                      {DAY_LABELS[i]}
                    </span>
                    <span
                      className={[
                        "font-mono text-base font-semibold leading-none",
                        isToday
                          ? "text-background"
                          : "text-foreground",
                      ].join(" ")}>
                      {d.getDate()}
                    </span>
                    <span
                      className={[
                        "w-1.5 h-1.5 rounded-full bg-primary transition-opacity duration-200",
                        hasData ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>

            {/* Calendar button — visible on both mobile and desktop */}
            <button
              onClick={() => setShowPicker(true)}
              className="flex-shrink-0 w-9 h-9 lg:w-10 lg:h-10 rounded-full lg:rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-background transition-colors cursor-pointer shadow-sm"
              title="Pick any date"
              aria-label="Pick any date">
              <svg
                width="15"
                height="15"
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

          {/* Right Side: Streak Box — desktop only; on mobile it's in the header above */}
          <div className="hidden lg:flex flex-shrink-0 ml-2">
            <div className="flex items-center justify-center gap-1.5 px-2.5 h-14 w-14 rounded-full border border-border bg-card shadow-md">
              <Flame
                size={20}
                className={hasLoggedToday ? "text-primary" : "text-muted-foreground"}
                fill={hasLoggedToday ? "var(--color-primary)" : "var(--color-border)"}
              />
              <span className="font-mono text-lg font-bold text-foreground">
                {streak}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showPicker && <DatePicker onClose={() => setShowPicker(false)} />}
    </>
  );
}
