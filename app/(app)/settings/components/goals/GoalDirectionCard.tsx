"use client";

import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import { GOALS } from "@/app/lib/constants";
import type { GoalKey, IntensityKey } from "@/app/types";
import { INTENSITIES, getIntensityLabel } from "../types";

interface GoalDirectionCardProps {
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
}

export function GoalDirectionCard({
  goal,
  setGoal,
  intensity,
  setIntensity,
  preview,
}: GoalDirectionCardProps) {
  return (
    <Card className="p-6">
      <div className="text-sm font-bold mb-4">Goal Direction</div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {GOALS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGoal(g.key as GoalKey)}
            className={`relative p-5 rounded-xl border text-center transition-colors ${
              goal === g.key
                ? "border-transparent bg-foreground text-background"
                : "border-transparent hover:border-foreground dark:hover:border-foreground"
            }`}>
            {goal === g.key && (
              <motion.div
                layoutId="active-goal"
                className="absolute inset-0 rounded-xl bg-foreground/20"
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              />
            )}
            <div className="relative z-10 text-3xl mb-2">{g.emoji}</div>
            <div className="relative z-10 text-sm font-bold">{g.label}</div>
            <div
              className={`relative z-10 text-xs mt-1 ${
                goal === g.key ? "text-background/60" : "text-muted-foreground"
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
                onClick={() => setIntensity(i.key)}
                className={`relative flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                  intensity === i.key
                    ? "border-transparent bg-foreground text-background"
                    : "border-transparent hover:border-foreground dark:hover:border-foreground dark:border-foreground"
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

      <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-primary via-primary/70 to-primary/40 dark:from-primary/80 dark:via-primary/70 dark:to-primary/60 text-white">
        <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">
          Estimated Target
        </div>
        <div className="font-mono text-3xl font-medium text-white">
          {preview.calTarget} kcal
        </div>
        <div className="text-[11px] text-white/90 mt-2 font-medium">
          P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
        </div>
        <div className="text-[11px] text-white/90 mt-1 font-medium">
          TDEE {preview.tdee} kcal
        </div>
      </div>
    </Card>
  );
}
