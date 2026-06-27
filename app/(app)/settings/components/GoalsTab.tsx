"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BlurFade from "@/app/components/animations/BlurFade";
import { useToast } from "@/app/components/ToastContainer";
import { Card } from "@/app/components/ui/card";
import { GOALS } from "@/app/lib/constants";
import { calcTDEE } from "@/app/lib/tdee";
import { lbsToKg } from "@/app/lib/units";
import type { Profile, GoalKey, IntensityKey, WeightUnit } from "@/app/types";
import { INTENSITIES, getIntensityLabel } from "./types";

interface GoalsTabProps {
  profile: Profile;
  goal: GoalKey;
  setGoal: (g: GoalKey) => void;
  intensity: IntensityKey;
  setIntensity: (i: IntensityKey) => void;
  steps: number;
  setSteps: (n: number) => void;
  workoutsPerWeek: number;
  setWorkoutsPerWeek: (n: number) => void;
  weightInput: string;
  setWeightInput: (s: string) => void;
  weightUnit: WeightUnit;
  setProfile: (p: Profile) => Promise<void>;
  logWeight: (
    kg: number,
    unit: WeightUnit,
    options?: { date?: string; note?: string },
  ) => Promise<unknown>;
}

export function GoalsTab({
  profile,
  goal,
  setGoal,
  intensity,
  setIntensity,
  steps,
  setSteps,
  workoutsPerWeek,
  setWorkoutsPerWeek,
  weightInput,
  setWeightInput,
  weightUnit,
  setProfile,
  logWeight,
}: GoalsTabProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const weightKg =
    weightUnit === "lbs" ? lbsToKg(Number(weightInput)) : Number(weightInput);

  const preview = calcTDEE({
    ...profile,
    goal,
    intensity,
    weight: weightKg,
    steps,
    workoutsPerWeek,
  });

  async function saveGoals() {
    if (saving) return;
    setSaving(true);
    try {
      const calc = calcTDEE({
        ...profile,
        goal,
        intensity,
        weight: weightKg,
        steps,
        workoutsPerWeek,
      });
      await setProfile({
        ...profile,
        goal,
        intensity,
        weight: weightKg,
        steps,
        workoutsPerWeek,
        tdee: calc.tdee,
        calTarget: calc.calTarget,
        protein: calc.protein,
        carbs: calc.carbs,
        fat: calc.fat,
      });
      // Bidirectional: a real weight change also creates a weigh-in.
      const previousWeight = profile.weight ?? 0;
      if (Math.abs(weightKg - previousWeight) > 0.05) {
        await logWeight(weightKg, weightUnit);
      }
      toast("Goals updated ✓");
    } catch (err) {
      console.error("[GoalsTab] save failed", err);
      toast("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BlurFade>
      <div className="flex flex-col gap-4">
        <ActivitySection
          steps={steps}
          setSteps={setSteps}
          workoutsPerWeek={workoutsPerWeek}
          setWorkoutsPerWeek={setWorkoutsPerWeek}
          weightInput={weightInput}
          setWeightInput={setWeightInput}
          weightUnit={weightUnit}
        />

        <GoalDirectionCard
          goal={goal}
          setGoal={setGoal}
          intensity={intensity}
          setIntensity={setIntensity}
          preview={preview}
        />

        <button
          onClick={saveGoals}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-60">
          {saving ? "Saving…" : "Save Goals"}
        </button>
      </div>
    </BlurFade>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function ActivitySection({
  steps,
  setSteps,
  workoutsPerWeek,
  setWorkoutsPerWeek,
  weightInput,
  setWeightInput,
  weightUnit,
}: {
  steps: number;
  setSteps: (n: number) => void;
  workoutsPerWeek: number;
  setWorkoutsPerWeek: (n: number) => void;
  weightInput: string;
  setWeightInput: (s: string) => void;
  weightUnit: WeightUnit;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="text-sm font-bold mb-1">Steps per Day</div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Average daily step count (from a fitness tracker or phone).
        </p>
        <div className="relative">
          <input
            type="number"
            min={0}
            max={30000}
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            steps
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-bold mb-1">Workouts per Week</div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Resistance or cardio sessions per week on average.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setWorkoutsPerWeek(n)}
              className={`relative py-3 rounded-xl border text-center text-sm font-bold transition-colors ${
                workoutsPerWeek === n
                  ? "border-transparent bg-foreground text-background"
                  : "border-foreground/10 text-foreground"
              }`}>
              {workoutsPerWeek === n && (
                <motion.div
                  layoutId="active-workouts"
                  className="absolute inset-0 rounded-xl bg-foreground text-background"
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                />
              )}
              <span className="relative z-10">{n}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-bold mb-1">Weight</div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Saving will log this as a new weigh-in.
        </p>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            min={weightUnit === "lbs" ? 66 : 30}
            max={weightUnit === "lbs" ? 500 : 230}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="w-full px-3.5 py-3 pr-14 border border-transparent rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {weightUnit}
          </span>
        </div>
      </Card>
    </div>
  );
}

function GoalDirectionCard({
  goal,
  setGoal,
  intensity,
  setIntensity,
  preview,
}: {
  goal: GoalKey;
  setGoal: (g: GoalKey) => void;
  intensity: IntensityKey;
  setIntensity: (i: IntensityKey) => void;
  preview: {
    calTarget: number;
    protein: number;
    carbs: number;
    fat: number;
    tdee: number;
  };
}) {
  return (
    <Card className="p-6">
      <div className="text-sm font-bold mb-4">Goal Direction</div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGoal(g.key as GoalKey)}
            className={`relative p-5 rounded-xl border text-center transition-colors ${
              goal === g.key
                ? "border-transparent bg-foreground text-background"
                : "border-foreground/10 hover:border-foreground dark:border-foreground/10 dark:hover:border-foreground"
            }`}>
            {goal === g.key && (
              <motion.div
                layoutId="active-goal"
                className="absolute inset-0 rounded-xl bg-foreground"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <div className="relative z-10 text-3xl mb-2">{g.emoji}</div>
            <div className="relative z-10 text-sm font-bold">{g.label}</div>
            <div
              className={`relative z-10 text-xs mt-1 ${
                goal === g.key
                  ? "text-background/60"
                  : "text-muted-foreground"
              }`}>
              {g.sub}
            </div>
          </button>
        ))}
      </div>

      {goal !== "maintain" && (
        <>
          <div className="text-sm font-bold mb-4">Intensity</div>
          <div className="flex flex-col gap-3 mb-8">
            {INTENSITIES.map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => setIntensity(i.key)}
                className={`relative flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                  intensity === i.key
                    ? "border-transparent bg-foreground text-background"
                    : " hover:border-foreground dark:border-foreground/10 dark:hover:border-foreground border-foreground/10"
                }`}>
                {intensity === i.key && (
                  <motion.div
                    layoutId="active-intensity"
                    className="absolute inset-0 rounded-xl bg-foreground text-background"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    intensity === i.key
                      ? "bg-card text-foreground"
                      : "bg-background"
                  }`}>
                  {goal === "cut" ? "−" : "+"}
                  {i.pct}
                </div>
                <div className="relative z-10">
                  <div className="font-bold text-sm">
                    {getIntensityLabel(i.key, goal).label}
                  </div>
                  <div
                    className={`text-xs mt-0.5 ${
                      intensity === i.key
                        ? "text-background/70"
                        : "text-muted-foreground"
                    }`}>
                    {getIntensityLabel(i.key, goal).desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="bg-background rounded-xl p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Estimated Target
        </div>
        <div className="font-mono text-3xl font-medium">
          {preview.calTarget} kcal
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 font-medium">
          P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 font-medium">
          TDEE {preview.tdee} kcal
        </div>
      </div>
    </Card>
  );
}
