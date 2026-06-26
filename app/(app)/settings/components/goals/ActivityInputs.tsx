"use client";

import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import type { WeightUnit } from "@/app/types";

interface ActivityInputsProps {
  steps: number;
  setSteps: (n: number) => void;
  workoutsPerWeek: number;
  setWorkoutsPerWeek: (n: number) => void;
  weightInput: string;
  setWeightInput: (s: string) => void;
  weightUnit: WeightUnit;
}

/**
 * Three side-by-side input cards: daily steps, workouts per week,
 * and the current weight. The weight card uses the user's display
 * unit and shows the unit suffix on the right edge of the input.
 */
export function ActivityInputs({
  steps,
  setSteps,
  workoutsPerWeek,
  setWorkoutsPerWeek,
  weightInput,
  setWeightInput,
  weightUnit,
}: ActivityInputsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="text-sm font-bold mb-1">Steps per Day</div>
        <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
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
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-[#9B9895]">
            steps
          </span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-sm font-bold mb-1">Workouts per Week</div>
        <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
          Resistance or cardio sessions per week on average.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setWorkoutsPerWeek(n)}
              className={`relative py-3 rounded-xl border text-center text-sm font-bold transition-colors ${
                workoutsPerWeek === n
                  ? "border-transparent bg-foreground text-background"
                  : "border-foreground text-foreground"
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
        <p className="text-xs text-[#9B9895] mb-4 leading-relaxed">
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
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold uppercase tracking-wider text-[#9B9895]">
            {weightUnit}
          </span>
        </div>
      </Card>
    </div>
  );
}