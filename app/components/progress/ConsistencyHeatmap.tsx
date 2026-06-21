"use client";

import React, { useRef, useState, useMemo } from "react";
import { Flame, Calendar, TrendingUp, Zap, Dumbbell } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useApp } from "@/app/context/AppContext";

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

/** Return a local YYYY-MM-DD string for a Date (avoids UTC offset issues) */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Return the Monday of the week containing `d` */
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const out = new Date(d);
  out.setDate(d.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

type DayCell = {
  dateKey: string; // YYYY-MM-DD
  label: string; // day label for tooltip (e.g. "Mon 2 Jun")
  intensity: number; // 0–1 (0 = no data)
  /** kcal logged (meals mode) */
  kcal: number;
  /** minutes of workout (workouts mode) */
  workoutMinutes: number;
  hasWorkout: boolean;
  isFuture: boolean;
};

type HeatmapMode = "meals" | "workouts";

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export function ConsistencyHeatmap({ mode = "meals" }: { mode?: HeatmapMode }) {
  const { state } = useApp();
  const meals = state.meals ?? {};
  const workouts = state.workouts ?? {};
  const calTarget = state.profile?.calTarget ?? 2000;
  // "Hit" target for a workout day = 60 active minutes. Anything above
  // that saturates the cell at full intensity.
  const WORKOUT_MIN_TARGET = 60;

  // Tone per mode so the two heatmaps are visually distinct.
  const accent = mode === "workouts" ? "34,197,94" : "249,115,22"; // green vs orange
  const accentClass = mode === "workouts" ? "text-[#22C55E]" : "text-[#F97316]";
  const accentSoft =
    mode === "workouts"
      ? "bg-[#22C55E]/10 border-[#22C55E]/20"
      : "bg-primary/10 border-primary/20";

  const WEEKS = 16; // columns
  const DAYS = 7; // rows (Mon–Sun)

  /* Build the grid: WEEKS columns of 7 days, newest week on the right */
  const cells = useMemo<DayCell[][]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMonday = startOfWeek(today);

    const grid: DayCell[][] = [];

    for (let w = WEEKS - 1; w >= 0; w--) {
      const weekStart = new Date(todayMonday);
      weekStart.setDate(todayMonday.getDate() - w * 7);
      const col: DayCell[] = [];

      for (let d = 0; d < DAYS; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        const dateKey = toDateKey(date);
        const isFuture = date > today;

        const dayMeals = meals[dateKey] ?? [];
        // Only count meals that were actually saved on this date (not backdated).
        // Meals without a savedDate are old data — give them the benefit of the doubt.
        const validMeals = dayMeals.filter(
          (m) => !m.savedDate || m.savedDate === dateKey,
        );
        const kcal = validMeals.reduce((sum, m) => sum + (m.cal ?? 0), 0);
        const dayWorkouts = workouts[dateKey] ?? [];
        const workoutMinutes = dayWorkouts.reduce(
          (sum, w) => sum + (w.duration ?? 0),
          0,
        );
        const hasWorkout = dayWorkouts.length > 0;

        // intensity: 0 = nothing, scales to 1.0 at ≥ target for the active mode.
        // Meals: kcal vs daily target. Workouts: minutes vs 60-min target.
        let intensity = 0;
        if (!isFuture) {
          const raw =
            mode === "workouts"
              ? workoutMinutes / WORKOUT_MIN_TARGET
              : kcal / calTarget;
          if (raw > 0) {
            const clamped = Math.min(raw, 1.0);
            // 4 visible levels for cleaner cell differentiation
            if (clamped < 0.25) intensity = 0.2;
            else if (clamped < 0.5) intensity = 0.45;
            else if (clamped < 0.75) intensity = 0.7;
            else intensity = 1.0;
          }
        }

        col.push({
          dateKey,
          label: date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          intensity,
          kcal,
          workoutMinutes,
          hasWorkout,
          isFuture,
        });
      }
      grid.push(col);
    }
    return grid;
  }, [meals, workouts, calTarget, mode]);

  /* Streak and stats derived from real data */
  const { currentStreak, bestStreak, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let best = 0;
    let run = 0;
    let total = 0;

    // "Logged" predicate depends on the active mode.
    const isLogged = (key: string) =>
      mode === "workouts"
        ? (workouts[key] ?? []).length > 0
        : (meals[key] ?? []).some((m) => !m.savedDate || m.savedDate === key);

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);

      if (isLogged(key)) {
        total++;
        run++;
        best = Math.max(best, run);
      } else {
        if (i > 0) run = 0; // allow today to be unlogged without breaking streak
      }
    }
    // recompute current streak correctly
    let cs = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);
      if (i === 0 && !isLogged(key)) continue; // grace for today
      if (isLogged(key)) cs++;
      else break;
    }

    return { currentStreak: cs, bestStreak: best, totalDays: total };
  }, [meals, workouts, mode]);

  /* Tooltip state */
  const [tooltip, setTooltip] = useState<{
    cell: DayCell;
    x: number;
    y: number;
  } | null>(null);

  /* inView */
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });

  /* Month labels (show only when month changes between weeks) */
  const monthLabels = useMemo(() => {
    return cells.map((col, wi) => {
      const firstDay = col[0];
      const prevCol = wi > 0 ? cells[wi - 1][0] : null;
      const thisMonth = new Date(firstDay.dateKey).getMonth();
      const prevMonth = prevCol ? new Date(prevCol.dateKey).getMonth() : -1;
      return thisMonth !== prevMonth
        ? new Date(firstDay.dateKey).toLocaleDateString("en-GB", {
            month: "short",
          })
        : null;
    });
  }, [cells]);

  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="w-full ">
      <div
        className="relative bg-card border border-border rounded-2xl overflow-visible
                   cursor-default transition-[border-color,box-shadow] duration-300
               ">
        <div className="relative z-10 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center ${accentSoft}`}>
                  {mode === "workouts" ? (
                    <Dumbbell size={14} className={accentClass} />
                  ) : (
                    <Calendar size={14} className="text-primary" />
                  )}
                </div>
                <span className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground">
                  {mode === "workouts"
                    ? "Workout Heatmap"
                    : "Consistency Heatmap"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-9">
                {WEEKS} weeks ·{" "}
                {mode === "workouts"
                  ? "workout minutes per day"
                  : "based on meals logged"}
              </p>
            </div>

            {/* Stat chips */}
            <div className="flex items-center gap-2 flex-wrap ml-9 sm:ml-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-border/60">
                <TrendingUp size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Best: {bestStreak}d
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/[0.04] border border-border/60">
                <Zap size={12} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {totalDays} {mode === "workouts" ? "workouts" : "days"} total
                </span>
              </div>
            </div>
          </div>

          {/* Month row */}
          <div className="flex gap-[2px] sm:gap-[3px] mb-1 pl-5 sm:pl-6">
            {monthLabels.map((label, wi) => (
              <div
                key={wi}
                className="shrink-0 text-[8px] sm:text-[9px] text-muted-foreground font-medium text-left truncate"
                style={{ width: "clamp(10px, 1.4vw, 20px)" }}>
                {label ?? ""}
              </div>
            ))}
          </div>

          {/* Grid: day-name column + weeks */}
          <div className="flex gap-[2px] sm:gap-[3px] overflow-x-auto">
            {/* Day name column */}
            <div className="flex flex-col gap-[2px] sm:gap-[3px] pr-1 shrink-0">
              {dayNames.map((d, i) => (
                <div
                  key={i}
                  className="text-[8px] sm:text-[9px] text-muted-foreground font-medium w-4 flex items-center justify-center"
                  style={{ height: "clamp(10px, 2vw, 14px)" }}>
                  {i % 2 === 0 ? d : ""}
                </div>
              ))}
            </div>

            {/* Heatmap columns */}
            {cells.map((col, wi) => (
              <div
                key={wi}
                className="flex flex-col gap-[2px] sm:gap-[3px] shrink-0"
                style={{ width: "clamp(10px, 1.4vw, 20px)" }}>
                {col.map((cell, di) => {
                  const bg = cell.isFuture
                    ? "transparent"
                    : cell.intensity > 0
                      ? `rgba(${accent},${cell.intensity})`
                      : "rgba(0,0,0,0.05)";

                  const emptyBg = cell.isFuture
                    ? "transparent"
                    : cell.intensity > 0
                      ? `rgba(${accent},${cell.intensity})`
                      : "bg-foreground/10 dark:bg-foreground/15";

                  return (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{
                        delay: 0.05 + (wi * DAYS + di) * 0.003,
                        duration: 0.25,
                        ease: "backOut",
                      }}
                      className={`rounded-[3px] relative group/cell cursor-pointer ${cell.intensity === 0 && !cell.isFuture ? "dark:bg-foreground/15 bg-foreground/10" : ""}`}
                      style={{
                        backgroundColor: cell.isFuture
                          ? "transparent"
                          : cell.intensity > 0
                            ? `rgba(${accent},${cell.intensity})`
                            : undefined,
                        // In meals mode, the orange workout border is a useful
                        // cross-signal. In workouts mode, every cell already
                        // represents a workout day, so the border is noise.
                        border:
                          mode === "meals" && cell.hasWorkout && !cell.isFuture
                            ? "1px solid rgba(249,115,22,0.5)"
                            : "1px solid transparent",
                        aspectRatio: "1",
                        minHeight: "clamp(10px, 2vw, 14px)",
                      }}
                      onMouseEnter={(e) => {
                        if (!cell.isFuture) {
                          const rect = (
                            e.target as HTMLElement
                          ).getBoundingClientRect();
                          setTooltip({
                            cell,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      whileHover={!cell.isFuture ? { scale: 1.4 } : {}}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${accentSoft}`}>
              <Flame size={12} className={accentClass} />
              <span className={`text-xs font-bold ${accentClass}`}>
                {currentStreak}d streak
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">Less</span>
              {[0, 0.2, 0.45, 0.7, 1.0].map((a, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-[3px] ${a === 0 ? "bg-foreground/10 dark:bg-foreground/15" : ""}`}
                  style={{
                    backgroundColor:
                      a === 0 ? undefined : `rgba(${accent},${a})`,
                  }}
                />
              ))}
              <span className="text-[9px] text-muted-foreground">More</span>
              {mode === "meals" && (
                <span className="text-[9px] text-muted-foreground ml-1 sm:ml-2 border-l border-border pl-1 sm:pl-2 flex items-center gap-1">
                  <span className="w-3 h-3 rounded-[3px] inline-block border border-primary/50 bg-transparent" />
                  + workout
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating tooltip (portal-like, fixed position) */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}>
          <div className="bg-foreground text-background text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            <div className="font-bold">{tooltip.cell.label}</div>
            {mode === "workouts" ? (
              tooltip.cell.workoutMinutes > 0 ? (
                <div className="text-background/70">
                  {tooltip.cell.workoutMinutes} min ·{" "}
                  {tooltip.cell.kcal > 0
                    ? `${tooltip.cell.kcal.toLocaleString()} kcal`
                    : "no meals"}
                </div>
              ) : (
                <div className="text-background/50">No workout logged</div>
              )
            ) : tooltip.cell.kcal > 0 ? (
              <div className="text-background/70">
                {tooltip.cell.kcal.toLocaleString()} kcal logged
                {tooltip.cell.hasWorkout && " · 💪 workout"}
              </div>
            ) : (
              <div className="text-background/50">No meals logged</div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
