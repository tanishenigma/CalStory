"use client";

import { useState } from "react";
import BlurFade from "@/app/components/animations/BlurFade";
import { useToast } from "@/app/components/ToastContainer";
import { calcTDEE } from "@/app/lib/tdee";
import { lbsToKg } from "@/app/lib/units";
import type {
  Profile,
  GoalKey,
  IntensityKey,
  WeightUnit,
} from "@/app/types";
import { ActivityInputs } from "./goals/ActivityInputs";
import { GoalDirectionCard } from "./goals/GoalDirectionCard";
import { SaveBar } from "./goals/SaveBar";

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

  async function saveGoal() {
    setSaving(true);
    const base = {
      ...profile,
      goal,
      intensity,
      weight: weightKg,
      steps,
      workoutsPerWeek,
    };
    const calc = calcTDEE(base);
    await setProfile({
      ...base,
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });

    // Same bidirectional contract as the Edit profile modal:
    // a real weight change is logged as a new weigh-in so the
    // progress page picks it up immediately.
    const previousWeight = profile.weight ?? 0;
    if (Math.abs(weightKg - previousWeight) > 0.05) {
      await logWeight(weightKg, weightUnit);
    }
    setSaving(false);
    toast("Goals updated ✓");
  }

  return (
    <BlurFade>
      <div className="flex flex-col gap-4">
        <ActivityInputs
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

        <SaveBar saving={saving} onSave={saveGoal} />
      </div>
    </BlurFade>
  );
}