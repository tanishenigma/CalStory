"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, todayLocalKey } from "@/app/context/AppContext";
import { DAY_LABELS } from "@/app/lib/constants";
import DatePicker from "@/app/components/DatePicker";
import BrandLogo from "@/app/components/BrandLogo";
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
  const [mobileOffset, setMobileOffset] = useState<number>(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const streak = useStreak();
  const today = todayLocalKey();

  useEffect(() => {
    setWeekOffset(0);
    setMobileOffset(0);
  }, [state.selDate]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      if (stripRef.current) {
        stripRef.current.scrollLeft = 0;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [state.selDate, weekOffset]);

  const days = getMondayWeek(state.selDate, weekOffset);
  const selectedDate = new Date(`${state.selDate}T12:00:00`);
  const mobileStartDate = new Date(selectedDate);
  mobileStartDate.setDate(selectedDate.getDate() - 1 + mobileOffset);
  const mobileDays = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(mobileStartDate);
    day.setDate(mobileStartDate.getDate() + index);
    return day;
  });
  const dateKey = (day: Date) =>
    `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  const mobileVisibleKeys = new Set(mobileDays.map(dateKey));
  const desktopVisibleKeys = new Set(days.map(dateKey));
  const renderDays = [...days, ...mobileDays]
    .filter(
      (day, index, all) =>
        all.findIndex((candidate) => dateKey(candidate) === dateKey(day)) === index,
    )
    .sort((a, b) => a.getTime() - b.getTime());

  const lastDayKey = dateKey(days[6]);
  const mobileLastDayKey = dateKey(mobileDays[4]);
  const disableNextWeek = lastDayKey >= today;
  const disableNextMobileWindow = mobileLastDayKey >= today;

  const hasLoggedToday =
    (state.meals[today] || []).length > 0 ||
    (state.workouts[today] || []).length > 0 ||
    Boolean(state.hydrationLogs[today]?.entries.length) ||
    Boolean(state.hydrationLog?.date === today && state.hydrationLog.entries.length);

  return (
    <>
      <div className="flex flex-col mb-6 w-full">
        {/* Mobile-only header: logo + streak above the week strip */}
        <div className="lg:hidden flex items-center justify-between px-1 pb-3">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-8 w-8" />
            <span className="font-heading font-bold text-base text-foreground tracking-tight">
              CalStory
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 px-2.5 h-14 w-14 rounded-full border border-border bg-card shadow-md mb-2">
            <Flame
              size={20}
              className={
                hasLoggedToday ? "text-primary" : "text-muted-foreground"
              }
              fill={
                hasLoggedToday ? "var(--color-primary)" : "var(--color-border)"
              }
            />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={streak}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 18,
                }}
                className="text-xl font-bold text-foreground tabular-nums">
                {streak}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Week Strip row: Nav, Strip, Calendar, (Streak on desktop only) */}
        <div className="flex items-center w-full gap-2">
          <div
            ref={stripRef}
            className="flex min-w-0 flex-1 items-center justify-between gap-1 overflow-hidden scrollbar-hide pr-2 lg:gap-3 lg:pr-0">
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => {
                  setWeekOffset((w) => w - 1);
                  setMobileOffset((offset) => offset - 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-background lg:h-10 lg:w-10 lg:rounded-xl"
                title="Previous week"
                aria-label="Previous week">
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => {
                  setWeekOffset((w) => w + 1);
                  setMobileOffset((offset) => offset + 1);
                }}
                disabled={disableNextWeek && disableNextMobileWindow}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:w-10 lg:rounded-xl"
                title="Next week"
                aria-label="Next week">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Days Strip */}
            {/* Both mobile and desktop: circular buttons, fixed-size */}
            <div className="flex gap-2 lg:gap-3 flex-nowrap shrink-0 items-center ">
              {renderDays.map((d) => {
                const key = dateKey(d);
                const dayIndex = (d.getDay() + 6) % 7;
                const isFuture = key > today;
                const isToday = key === today;
                const isSel = key === state.selDate && !isToday;
                const hasData =
                  (state.meals[key] || []).length > 0 ||
                  (state.workouts[key] || []).length > 0 ||
                  Boolean(state.hydrationLogs[key]?.entries.length) ||
                  Boolean(state.hydrationLog?.date === key && state.hydrationLog.entries.length);

                return (
                  <motion.button
                    key={key}
                    onClick={() => setDate(key)}
                    disabled={isFuture}
                    aria-pressed={key === state.selDate}
                    /* The hover/tap scale is applied to an inner
                     * element (below) instead of the button itself.
                     * The strip container is `overflow-x-auto` for
                     * mobile horizontal scroll, which would clip any
                     * `transform: scale()` overflow on the button's
                     * outer box — cutting off the dashed border on
                     * selected days and the `hover:bg-foreground/20`
                     * background on normal days. Scaling an inner
                     * element keeps the button's outer bounds static
                     * so backgrounds + borders render fully. */
                    whileTap={isFuture ? undefined : { scale: 0.94 }}
                    className={[
                      "flex flex-col items-center justify-center gap-1 border-2 shrink-0 rounded-full p-2 transition-transform duration-150 ease-out",
                      "size-11 lg:size-14",
                      mobileVisibleKeys.has(key) && desktopVisibleKeys.has(key)
                        ? "flex"
                        : mobileVisibleKeys.has(key)
                          ? "flex lg:hidden"
                          : "hidden lg:flex",
                      isFuture
                        ? "opacity-20 cursor-not-allowed"
                        : "cursor-pointer",
                      isToday && "bg-foreground border-transparent",
                      isSel &&
                        !isToday &&
                        "border-primary border-dotted bg-foreground/5",
                      !isSel && !isToday && "border-transparent",
                      !isToday &&
                        !isSel &&
                        !isFuture &&
                        "bg-transparent hover:bg-foreground/20 hover:opacity-80 hover:scale-105 opacity-40",
                    ]

                      .filter(Boolean)
                      .join(" ")}>
                    <motion.span className="flex flex-col items-center justify-center gap-1">
                      <span
                        className={[
                          "text-[10px] font-bold tracking-wider uppercase leading-none",
                          isToday ? "text-background" : "text-muted-foreground",
                        ].join(" ")}>
                        {DAY_LABELS[dayIndex]}
                      </span>
                      <span
                        className={[
                          "font-mono text-base font-semibold leading-none",
                          isToday ? "text-background" : "text-foreground",
                        ].join(" ")}>
                        {d.getDate()}
                      </span>
                      <span
                        className={[
                          "w-1.5 h-1.5 rounded-full bg-primary",
                          hasData
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-0",
                          "transition-all duration-200",
                        ].join(" ")}
                      />
                    </motion.span>
                  </motion.button>
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
                className={
                  hasLoggedToday ? "text-primary" : "text-muted-foreground"
                }
                fill={
                  hasLoggedToday
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }
              />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={streak}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 18,
                  }}
                  className="font-mono text-lg font-bold text-foreground tabular-nums">
                  {streak}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {showPicker && <DatePicker onClose={() => setShowPicker(false)} />}
    </>
  );
}
