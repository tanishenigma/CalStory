"use client";

import React, { useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useHydration } from "@/app/hooks/useHydration";
import WeekStrip from "@/app/components/WeekStrip";
import CalorieHero from "@/app/components/CalorieHero";
import MacroPills from "@/app/components/MacroPills";
import HydrationBar from "@/app/components/HydrationBar";
import { Card, CardContent } from "@/app/components/ui/card";
import { MEAL_ICONS } from "@/app/lib/constants";
import { Utensils } from "lucide-react";
import { TodaySections } from "@/app/components/TodaySections";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";


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
  const { selDate, meals, workouts, hydrationLog } = state;
  const hydration = useHydration(hydrationLog, profile?.volumeUnit ?? "ml");
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // When landing from a successful Polar checkout, confirm it server-side
  // so Firestore is updated immediately (doesn't rely on webhook delivery).
  useEffect(() => {
    const welcome = searchParams.get("welcome");
    const checkoutId = searchParams.get("checkout_id");
    if (welcome !== "1" || !checkoutId || !user) return;

    // Strip params from URL right away to avoid re-running on refresh
    router.replace("/dashboard", { scroll: false });

    async function confirmCheckout() {
      try {
        const token = await getIdToken(user!);
        const res = await fetch(
          `/api/checkout-success?checkout_id=${encodeURIComponent(checkoutId!)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = (await res.json()) as { ok?: boolean; tier?: string; error?: string };
        if (data.ok && data.tier) {
          toast.success(
            `🎉 Welcome to CalStory ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)}! Your plan is now active.`,
            { duration: 6000 },
          );
          // Hard-reload so AppContext re-hydrates with the new subscription tier
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch {
        // Non-critical — webhook will catch up if this fails
      }
    }

    void confirmCheckout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* Bottom Row: Workout & Meals */}
        <TodaySections
          todayWorkouts={todayWorkouts}
          todayMeals={todayMeals}
          recentWorkouts={recentWorkouts}
          recentMeals={recentMeals}
          mealIcons={MEAL_ICONS}
        />
      </div>
    </div>
  );
}
