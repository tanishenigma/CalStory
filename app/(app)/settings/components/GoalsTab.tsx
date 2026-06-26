"use client";

import BlurFade from "@/app/components/animations/BlurFade";
import { calcTDEE } from "@/app/lib/tdee";
import { lbsToKg } from "@/app/lib/units";
import type { Profile, GoalKey, IntensityKey, WeightUnit } from "@/app/types";
import {
  ActivityInputs,
  type ActivitySaveTarget,
} from "./goals/ActivityInputs";
import { GoalDirectionCard } from "./goals/GoalDirectionCard";
import { SaveBar } from "./goals/SaveBar";
import { useAutoSave } from "./goals/useAutoSave";

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
  // Convert the displayed weight string → kg once and share between
  // the live preview and every save path so they can never drift.
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

  // Three independent auto-save hooks — one per card — so each
  // card can show its own "Saving…" indicator without flickering
  // when another card saves.
  const stepsSaver = useAutoSave(persistSteps, 700);
  const workoutsSaver = useAutoSave(persistWorkouts, 0);
  const weightSaver = useAutoSave(persistWeight, 700);

  async function persistSteps() {
    const calc = calcTDEE({
      ...profile,
      steps,
      weight: profile.weight,
    });
    await setProfile({
      ...profile,
      steps,
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });
  }

  async function persistWorkouts() {
    const calc = calcTDEE({
      ...profile,
      workoutsPerWeek,
      weight: profile.weight,
    });
    await setProfile({
      ...profile,
      workoutsPerWeek,
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });
  }

  async function persistWeight() {
    const calc = calcTDEE({
      ...profile,
      weight: weightKg,
    });
    await setProfile({
      ...profile,
      weight: weightKg,
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });
    // Bidirectional: a real weight change also creates a weigh-in
    // so the progress page picks it up immediately.
    const previousWeight = profile.weight ?? 0;
    if (Math.abs(weightKg - previousWeight) > 0.05) {
      await logWeight(weightKg, weightUnit);
    }
  }

  // The bottom Save button covers goal direction + intensity
  // (the live preview updates as the user clicks — this just
  // persists the change).
  async function saveGoal() {
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
      tdee: calc.tdee,
      calTarget: calc.calTarget,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat,
    });
  }

  function triggerSave(target: ActivitySaveTarget) {
    if (target === "steps") stepsSaver.run();
    else if (target === "weight") weightSaver.run();
    else workoutsSaver.run();
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
          onAutoSave={triggerSave}
          savingSteps={stepsSaver.saving}
          savingWorkouts={workoutsSaver.saving}
          savingWeight={weightSaver.saving}
        />

        <GoalDirectionCard
          goal={goal}
          setGoal={setGoal}
          intensity={intensity}
          setIntensity={setIntensity}
          preview={preview}
        />

        <SaveBar saving={false} onSave={saveGoal} />
      </div>
    </BlurFade>
  );
}
