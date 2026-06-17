"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { useApp, todayKey } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import WeekStrip from "@/app/components/WeekStrip";
import CalorieHero from "@/app/components/CalorieHero";
import MacroPills from "@/app/components/MacroPills";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card, CardContent } from "@/app/components/ui/card";
import { MEAL_ICONS } from "@/app/lib/constants";
import { Utensils, Dumbbell } from "lucide-react";

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
  const { state } = useApp();
  const { selDate, meals, workouts } = state;

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  if (isLoading || !profile) return <Spinner />;

  const todayMeals = meals[selDate] || [];
  const todayWorkouts = workouts[selDate] || [];
  const totals = sumMacros(todayMeals);

  const recentMeals = [...todayMeals].reverse().slice(0, 5);
  const recentWorkouts = [...todayWorkouts].reverse().slice(0, 5);

  const targetKcal = profile.calTarget || 2000;

  const targetMacros = {
    p: profile.protein || Math.round((targetKcal * 0.3) / 4),
    c: profile.carbs || Math.round((targetKcal * 0.4) / 4),
    f: profile.fat || Math.round((targetKcal * 0.3) / 9),
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
                <span className="text-[17px] font-bold text-[#1A1916] dark:text-[#f7f6f3]">
                  Today's Workout
                </span>
                <Link
                  href="/workouts"
                  className="text-[13px] font-semibold text-[#9B9895] hover:text-[#1A1916] transition-colors">
                  See all →
                </Link>
              </div>

              {todayWorkouts.length === 0 ? (
                <Link href="/workouts" className="block">
                  <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px] hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="text-3xl mb-1">🏋️</div>
                    <div className="font-bold text-[14px] text-[#1A1916] dark:text-[#f7f6f3]">
                      No workout yet
                    </div>
                    <div className="text-[12px] text-[#9B9895]">
                      Tap to go to Workouts page to log a session
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card className="flex flex-col gap-2">
                  <CardContent className="p-0 flex flex-col divide-y divide-[#F0EFEC]">
                    {recentWorkouts.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-4 p-4 hover:bg-subtle transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0">
                          💪
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[15px] text-[#1A1916] dark:text-[#f7f6f3] truncate">
                            {w.name}
                          </div>
                          <div className="text-xs text-[#9B9895] capitalize">
                            {w.duration} min • {w.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </section>
          </BlurFade>

          <BlurFade delay={0.25}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-[#1A1916] dark:text-[#f7f6f3]">
                  Recently uploaded
                </span>
                <Link
                  href="/nutrition"
                  className="text-[13px] font-semibold text-[#9B9895] hover:text-[#1A1916] transition-colors">
                  See all →
                </Link>
              </div>

              {todayMeals.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 text-center gap-1 min-h-[200px]">
                  <div className="text-3xl mb-1">🍽️</div>
                  <div className="font-bold text-[14px] text-[#1A1916] dark:text-[#f7f6f3]">
                    No meals logged
                  </div>
                  <div className="text-[12px] text-[#9B9895]">
                    Tap + below to add a meal
                  </div>
                </Card>
              ) : (
                <Card className="flex flex-col">
                  <CardContent className="p-0 flex flex-col divide-y divide-[#F0EFEC]">
                    {recentMeals.map((m) => {
                      const Icon = MEAL_ICONS[m.time] || Utensils;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-4 p-4 hover:bg-subtle transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-xl flex-shrink-0">
                            <Icon
                              size={20}
                              className="text-[#1A1916] dark:text-[#f7f6f3]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[15px] text-[#1A1916] dark:text-[#f7f6f3] truncate">
                              {m.name}
                            </div>
                            <div className="text-xs text-[#9B9895] capitalize">
                              {m.time}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-lg text-[#1A1916] dark:text-[#f7f6f3] tabular-nums">
                              {m.cal}
                            </div>
                            <div className="text-[9px] text-[#9B9895] font-bold uppercase tracking-widest">
                              kcal
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </section>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
