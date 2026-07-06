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
import HydrationBar from "@/app/components/HydrationBar";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card, CardContent } from "@/app/components/ui/card";
import { MEAL_ICONS } from "@/app/lib/constants";
import { Utensils } from "lucide-react";
import { TodaySections } from "@/app/components/TodaySections";

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
          <CalorieHero eaten={totals.cal} target={targetKcal} />

          <MacroPills macros={totals} target={targetMacros} />
        </div>
        {/* Bottom Row: Workout & Meals */}
        <TodaySections
          todayWorkouts={todayWorkouts}
          todayMeals={todayMeals}
          recentWorkouts={recentWorkouts}
          recentMeals={recentMeals}
          mealIcons={MEAL_ICONS}

        />
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
        </div>{" "}
        {/* Hydration card */}
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
      </div>
    </div>
  );
}
