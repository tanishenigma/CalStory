"use client";

import React, { useRef, useMemo } from "react";
import { Flame, Apple, Target, TrendingUp, Check } from "lucide-react";
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

/** Sum the protein (g) and calories for a given day's meals.
 *  We only count meals that were actually saved on that day
 *  (savedDate matches) so backdated entries don't inflate the
 *  "hit" count. Old meals without savedDate are trusted as-is. */
function dayTotals(
  dayMeals: { cal: number; p: number; savedDate?: string }[] | undefined,
  dateKey: string,
) {
  if (!dayMeals) return { cal: 0, protein: 0 };
  let cal = 0;
  let protein = 0;
  for (const m of dayMeals) {
    // `savedDate` is set when addMeal runs. If it disagrees with
    // the date key, the meal was logged for a different day — skip.
    if (m.savedDate && m.savedDate !== dateKey) continue;
    cal += m.cal ?? 0;
    protein += m.p ?? 0;
  }
  return { cal, protein };
}

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

type Stat = {
  /** Tile label */
  label: string;
  /** Big number (e.g. "22") */
  value: number;
  /** Denominator shown under the number (e.g. "of 30 days") */
  caption: string;
  /** 0..1 ratio used for the mini bar / fill */
  ratio: number;
  /** Hex color used for the fill and accent */
  color: string;
  /** Tailwind classes for the icon chip background + border */
  chipClass: string;
  /** Tailwind class for the value text color */
  textClass: string;
  /** Lucide icon component */
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  /** "X% hit" / "X-day run" copy shown under the value */
  sublabel: string;
};

export function NutritionQuality() {
  const { state } = useApp();
  const meals = state.meals ?? {};
  const profile = state?.profile;

  // Targets default to sensible values when the profile hasn't
  // been filled in yet (during onboarding, for example).
  const calTarget = profile?.calTarget ?? 2000;
  const proteinTarget = profile?.protein ?? 120;

  // In-view animation: the card and each tile fade in once on
  // first scroll into view. `useInView` with `once: true` is
  // cheap and respects prefers-reduced-motion via framer's defaults.
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // ── 30-day window: protein hits, calorie hits, best streak ──
  const stats = useMemo(() => {
    const WINDOW = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For each of the last 30 days, decide whether the user hit
    // their protein target and calorie target.
    //   • protein hit = day.protein >= proteinTarget
    //   • calorie hit = |day.cal - calTarget| / calTarget <= 0.10
    // The 10% band matters: a 2100 vs 2000 day is "on plan" —
    // rigid equality would punish the user for normal variance.
    const proteinHits: boolean[] = [];
    const calorieHits: boolean[] = [];
    // Per-day summary used by the bar strip below the tiles.
    // 0 = no log, 1 = calorie hit, 2 = both calorie+protein, 3 = protein only.
    // We track it explicitly so the strip can colour days by
    // *which* goal the user hit, not just "hit or not".
    const dayKinds: number[] = [];

    for (let i = 0; i < WINDOW; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);
      const { cal, protein } = dayTotals(meals[key], key);

      // Today is allowed to be in-progress; we still count it
      // if it's already met the goal. This keeps the tile feeling
      // responsive to a same-day hit.
      const proteinHit = protein >= proteinTarget;
      const calDelta =
        calTarget > 0 ? Math.abs(cal - calTarget) / calTarget : 1;
      const calorieHit = calDelta <= 0.1 && cal > 0;
      proteinHits.push(proteinHit);
      calorieHits.push(calorieHit);

      const hasAnyLog = cal > 0 || protein > 0;
      let kind = 0;
      if (hasAnyLog) {
        if (calorieHit && proteinHit) kind = 2;
        else if (calorieHit) kind = 1;
        else if (proteinHit) kind = 3;
        else kind = 4; // logged but missed both
      }
      dayKinds.push(kind);
    }

    const proteinHitCount = proteinHits.filter(Boolean).length;
    const calorieHitCount = calorieHits.filter(Boolean).length;
    const proteinRatio = proteinHitCount / WINDOW;
    const calorieRatio = calorieHitCount / WINDOW;

    // Best streak: longest run of consecutive calorie hits.
    // We scan from oldest → newest (the array is newest-first,
    // so we reverse it). Skipping days with no logging at all
    // would inflate the streak, so we treat a "no log" day the
    // same as a "missed" day — the streak only counts active days.
    let best = 0;
    let run = 0;
    for (let i = proteinHits.length - 1; i >= 0; i--) {
      if (calorieHits[i]) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }

    return {
      proteinHitCount,
      calorieHitCount,
      bestStreak: best,
      proteinRatio,
      calorieRatio,
      window: WINDOW,
      // `dayKinds` is newest-first; the strip will reverse to draw
      // oldest-on-the-left, newest-on-the-right.
      dayKinds,
    };
  }, [meals, calTarget, proteinTarget]);

  const tiles: Stat[] = [
    {
      label: "Protein Goal Hit",
      value: stats.proteinHitCount,
      caption: `of ${stats.window} days`,
      ratio: stats.proteinRatio,
      color: "#3B82F6",
      chipClass: "bg-[#3B82F6]/10 border-[#3B82F6]/20",
      textClass: "text-[#3B82F6]",
      Icon: Apple,
      sublabel: `${(stats.proteinRatio * 100).toFixed(0)}% of days`,
    },
    {
      label: "Calorie Goal Hit",
      value: stats.calorieHitCount,
      caption: `of ${stats.window} days`,
      ratio: stats.calorieRatio,
      color: "#F97316",
      chipClass: "bg-primary/10 border-primary/20",
      textClass: "text-[#F97316]",
      Icon: Target,
      sublabel: `${(stats.calorieRatio * 100).toFixed(0)}% of days`,
    },
    {
      label: "Best Streak",
      value: stats.bestStreak,
      caption: "day run",
      ratio: Math.min(stats.bestStreak / stats.window, 1),
      color: "#22C55E",
      chipClass: "bg-[#22C55E]/10 border-[#22C55E]/20",
      textClass: "text-[#22C55E]",
      Icon: Flame,
      sublabel: "consecutive days",
    },
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="w-full ">
      <div className="relative bg-card border border-border rounded-2xl overflow-visible ">
        <div className="relative z-10 p-4 sm:p-6">
          {/* Header — mirrors the consistency heatmap's header layout
              (icon chip + title + subtitle) so the two cards feel
              like siblings. */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp size={14} className="text-primary" />
                </div>
                <span className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground">
                  Nutrition Quality
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-9">
                Last 30 days · how often you hit your daily targets
              </p>
            </div>

            {/* Summary chip — "X of 30 days" so the user can read the
                headline number without scanning all three tiles. */}
            <div className="flex items-center gap-2 flex-wrap ml-9 sm:ml-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Target size={12} className="text-[#F97316]" />
                <span className="text-xs font-bold text-[#F97316]">
                  {stats.calorieHitCount}/{stats.window} calories
                </span>
              </div>
            </div>
          </div>

          {/* Three stat tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tiles.map((t, idx) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.4,
                  delay: 0.1 + idx * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="relative rounded-xl border border-border bg-background/40 p-4 overflow-hidden">
                {/* Faint background bar at all times so the tile
                    has a "track" feel even when ratio is 0. */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1 bg-[#E8E7E4] dark:bg-[#3a3a3a]"
                  aria-hidden
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1 transition-[width] duration-700"
                  style={{
                    width: `${t.ratio * 100}%`,
                    backgroundColor: t.color,
                  }}
                  aria-hidden
                />

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center ${t.chipClass}`}>
                    <t.Icon size={14} className={t.textClass} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#9B9895]">
                    {t.label}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-4xl font-mono font-bold ${t.textClass}`}>
                    {t.value}
                  </span>
                  <span className="text-sm font-medium text-[#9B9895]">
                    {t.caption}
                  </span>
                </div>

                <div className="mt-2  text-[11px] text-[#9B9895]">
                  <span className="font-semibold text-foreground">
                    {(t.ratio * 100).toFixed(0)}%
                  </span>{" "}
                  {t.sublabel}
                </div>
              </motion.div>
            ))}
          </div>

          {/* 30-day strip — one bar per day, colour-coded by which
              goal was hit. Newest day sits on the right. This both
              fills the card to match the heatmap's height and
              gives the user a temporal view of their consistency
              (clusters, gaps, momentum) that the three summary
              numbers can't show. */}
        </div>
      </div>
    </motion.div>
  );
}
