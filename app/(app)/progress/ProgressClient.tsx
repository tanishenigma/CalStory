"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useApp } from "@/app/context/AppContext";
import { Streak } from "@/app/components/progress/Streak";
import { WeightProgress } from "@/app/components/progress/WeightProgress";
import { DailyAverageCalories } from "@/app/components/progress/DailyAverageCalories";
import { WeeklyEnergy } from "@/app/components/progress/WeeklyEnergy";
import { ExpenditureChanges } from "@/app/components/progress/ExpenditureChanges";
import { YourBMI } from "@/app/components/progress/YourBMI";
import WeightChanges from "@/app/components/progress/WeightChanges";
import { WeightHistory } from "@/app/components/progress/WeightHistory";
import { ConsistencyHeatmap } from "@/app/components/progress/ConsistencyHeatmap";
import { CalorieVsTdeeChart } from "@/app/components/progress/CalorieVsTdeeChart";
import { TodayFitnessSync } from "@/app/components/progress/TodayFitnessSync";
import { useFitnessAutoSync } from "@/app/hooks/useFitnessAutoSync";
import { Download } from "lucide-react";
import { ExportProgressModal } from "@/app/components/progress/ExportProgressModal";

export default function ProgressPage() {
  const { profile, isLoading } = useAuthGuard();
  const { state, saveFitnessLog } = useApp();
  const [mounted, setMounted] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Per-page-mount sync: visiting Progress also kicks a fitness sync
  // so the dashboard reflects fresh step data without the user needing
  // to open /fitness first.
  useFitnessAutoSync({
    enabled: !!profile,
    onSync: (log) => {
      void saveFitnessLog(log);
    },
  });

  const chartData = useMemo(() => {
    if (!profile) return [];

    const days = 14;
    const today = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      const dayMeals = state?.meals?.[key] || [];
      const intake = dayMeals.reduce((sum, m) => sum + (m.cal || 0), 0);

      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        intake,
        tdee: profile.tdee || 0,
      });
    }

    return data;
  }, [state?.meals, profile]);

  if (isLoading || !profile || !mounted) return <Spinner variant="progress" />;

  return (
    <div className="pb-24 p-4 md:p-6 lg:p-8 min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
          Progress
        </h1>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl bg-card hover:bg-muted/70 text-foreground border border-border shadow-xs text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export Progress</span>
        </button>
      </div>

      <ExportProgressModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      <TodayFitnessSync />
      <Streak />
      <div className="mb-4  grid grid-cols-1 lg:grid-cols-2 gap-4 items-center p-2">
        <ConsistencyHeatmap mode="meals" />
        <WeightHistory />
        {/* <NutritionQuality /> */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <WeightChanges />
        <ExpenditureChanges />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <WeeklyEnergy />
        <DailyAverageCalories />
      </div>
      <div className="flex flex-col gap-4">
        <WeightProgress />
        <CalorieVsTdeeChart data={chartData} tdeeResetDate="Apr 30" />
        <YourBMI />
      </div>
    </div>
  );
}
