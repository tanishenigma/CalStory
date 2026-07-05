"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useFastingTimer } from "@/app/hooks/useFastingTimer";
import { useHydration } from "@/app/hooks/useHydration";
import WeekStrip from "@/app/components/WeekStrip";
import CalorieHero from "@/app/components/CalorieHero";
import MacroPills from "@/app/components/MacroPills";
import FastingRing from "@/app/components/FastingRing";
import HydrationBar from "@/app/components/HydrationBar";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card, CardContent } from "@/app/components/ui/card";
import { MEAL_ICONS } from "@/app/lib/constants";
import { Utensils } from "lucide-react";

const DEFAULT_CAL_TARGET = 2000;
const PROTEIN_CAL_RATIO = 0.3;
const CARB_CAL_RATIO = 0.4;
const FAT_CAL_RATIO = 0.3;
const PROTEIN_CAL_PER_GRAM = 4;
const CARB_CAL_PER_GRAM = 4;
const FAT_CAL_PER_GRAM = 9;

function sumMacros(meals: { cal: number; p: number; c: number; f: number }[]) {
  return meals.reduce(
    (acc, m) => ({
      cal: acc.cal + m.cal,
      p: acc.p + m.p,
      c: acc.c + m.c,
      f: acc.f + m.f,
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );
}

export default function DashboardPage() {
  const { profile, isLoading } = useAuthGuard();
  const { state, addHydration, removeHydration, setHydrationGoal } = useApp();
  const { selDate, meals, workouts, fastingSession, hydrationLog } = state;
  const fastingTimer = useFastingTimer(fastingSession);
  const hydration = useHydration(hydrationLog, profile?.volumeUnit ?? "ml");

  if (isLoading || !profile) return <Spinner variant="dashboard" />;

  const todayMeals = meals[selDate] || [];
  const todayWorkouts = workouts[selDate] || [];
  const totals = sumMacros(todayMeals);

  const recentMeals = [...todayMeals].reverse().slice(0, 5);
  const recentWorkouts = [...todayWorkouts].reverse().slice(0, 5);

  const targetKcal = profile.calTarget || DEFAULT_CAL_TARGET;

  const targetMacros = {
    p:
      profile.protein ||
      Math.round((targetKcal * PROTEIN_CAL_RATIO) / PROTEIN_CAL_PER_GRAM),
    c:
      profile.carbs ||
      Math.round((targetKcal * CARB_CAL_RATIO) / CARB_CAL_PER_GRAM),
    f:
      profile.fat ||
      Math.round((targetKcal * FAT_CAL_RATIO) / FAT_CAL_PER_GRAM),
  };

  return (
    <div className="min-h-screen pb-20">
      <WeekStrip />

      <div className="flex flex-col gap-6 mt-4 sm:mt-8">
        {/* Top Row: Hero & Macros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BlurFade delay={0.1} className="h-full">
            <CalorieHero eaten={totals.cal} target={targetKcal} />
          </BlurFade>

          <BlurFade delay={0.15} className="h-full">
            <MacroPills macros={totals} target={targetMacros} />
          </BlurFade>
        </div>

        {/* Bottom Row: Workout & Meals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BlurFade delay={0.2}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-foreground">
                  Today's Workout
                </span>
                <Link
                  href="/workouts"
                  className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors dark:hover:text-foreground">
                  See all →
                </Link>
              </div>

              {todayWorkouts.length === 0 ? (
                <Link href="/workouts" className="block">
                  <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px] hover:bg-gray-50 transition-colors cursor-pointer ">
                    <div className="text-3xl mb-1" aria-hidden="true">
                      🏋️
                    </div>
                    <div className="font-bold text-[14px] text-foreground">
                      No workout yet
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      Tap to go to Workouts page to log a session
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card className="flex flex-col gap-2 ">
                  {recentWorkouts.map((w) => (
                    <CardContent
                      key={w.id}
                      className="flex flex-col divide-y divide-border p-2  ">
                      <div className="flex items-center gap-4 p-4 hover:bg-subtle transition-colors rounded-xl">
                        <div
                          className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0"
                          aria-hidden="true">
                          💪
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[15px] text-foreground truncate">
                            {w.name}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {w.duration} min • {w.type}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  ))}
                </Card>
              )}
            </section>
          </BlurFade>

          <BlurFade delay={0.25}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-foreground">
                  Today's Meals
                </span>
                <Link
                  href="/nutrition"
                  className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors dark:hover:text-foreground">
                  See all →
                </Link>
              </div>

              {todayMeals.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px]">
                  <div className="text-3xl mb-1" aria-hidden="true">
                    🍽️
                  </div>
                  <div className="font-bold text-[14px] text-foreground">
                    No meals logged
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    Tap + below to add a meal
                  </div>
                </Card>
              ) : (
                <Card className="flex flex-col">
                  {recentMeals.map((m) => {
                    const Icon = MEAL_ICONS[m.time] || Utensils;
                    return (
                      <CardContent
                        key={m.id}
                        className="flex items-center gap-4 p-4 m-2 hover:bg-subtle hover:rounded-xl transition-colors ">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0">
                          <Icon size={20} className="text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[15px] text-foreground truncate">
                            {m.name}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {m.time}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-lg text-foreground tabular-nums">
                            {m.cal}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                            kcal
                          </div>
                        </div>
                      </CardContent>
                    );
                  })}
                </Card>
              )}
            </section>
          </BlurFade>
        </div>

        {/* Third Row: Fasting & Hydration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fasting card */}
          {/* <BlurFade delay={0.3}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-foreground">
                  Fasting
                </span>
                <Link
                  href="/fasting"
                  className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {fastingSession?.status === "active"
                    ? "Manage →"
                    : "Start fast →"}
                </Link>
              </div>
              <Card className="p-6 flex flex-col items-center gap-4">
                <FastingRing
                  progress={fastingTimer.progress}
                  elapsedLabel={fastingTimer.elapsedLabel}
                  remainingLabel={fastingTimer.remainingLabel}
                  targetLabel={fastingTimer.targetLabel}
                  isComplete={fastingTimer.isComplete}
                  size={180}
                  strokeWidth={11}
                />
                {!fastingSession || fastingSession.status !== "active" ? (
                  <Link
                    href="/fasting"
                    id="dashboard-fasting-start"
                    className="w-full text-center py-2.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity">
                    Start a fast
                  </Link>
                ) : null}
              </Card>
            </section>
          </BlurFade> */}

          {/* Hydration card */}
          <BlurFade delay={0.35}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-foreground">
                  Hydration
                </span>
                <span className="text-[13px] font-semibold text-muted-foreground">
                  {hydration.pct >= 1
                    ? "Goal reached! 💧"
                    : `${Math.round(hydration.pct * 100)}%`}
                </span>
              </div>
              <Card className="p-5">
                <HydrationBar
                  totalMl={hydration.totalMl}
                  goalMl={hydration.goalMl}
                  pct={hydration.pct}
                  entries={hydration.entries}
                  volumeUnit={profile?.volumeUnit ?? "ml"}
                  onAdd={addHydration}
                  onRemove={removeHydration}
                  onSetGoal={setHydrationGoal}
                  goalReached={hydration.goalReached}
                />
              </Card>
            </section>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
