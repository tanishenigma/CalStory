"use client";

import { useEffect, useState } from "react";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { Streak } from "@/app/components/progress/Streak";
import { WeightProgress } from "@/app/components/progress/WeightProgress";
// import { ProgressPhotos } from "@/app/components/progress/ProgressPhotos";
import { DailyAverageCalories } from "@/app/components/progress/DailyAverageCalories";
import { WeeklyEnergy } from "@/app/components/progress/WeeklyEnergy";
import { ExpenditureChanges } from "@/app/components/progress/ExpenditureChanges";
import { YourBMI } from "@/app/components/progress/YourBMI";
import WeightChanges from "@/app/components/progress/WeightChanges";

export default function ProgressPage() {
  const { profile, isLoading } = useAuthGuard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !profile || !mounted) return <Spinner />;

  return (
    <div className="pb-24">
      <h1 className="mb-8 text-6xl font-bold text-[#1A1916] dark:text-[#f7f6f3]">
        Progress
      </h1>

      <Streak />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4  auto-rows-fr">
        {/* <ProgressPhotos /> */}
        <DailyAverageCalories />
        <WeightChanges />
        <WeeklyEnergy />
        <WeightProgress />
      </div>
      <ExpenditureChanges />
      <YourBMI />
    </div>
  );
}
