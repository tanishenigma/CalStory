"use client";

import React, { useState } from "react";
import { cn } from "@/app/lib/utils";
import type { PendingWorkout } from "@/app/types";

interface Props {
  workout: PendingWorkout;
  askSaveTemplate: boolean;
  onConfirm: (saveAsTemplate: boolean) => void;
  onEdit: () => void;
  isLogging?: boolean;
}

/* ------------------------------------------------------------------
 * WorkoutConfirmationCard
 *
 * Blue/indigo gradient card shown when the AI parses a workout.
 * Includes an optional "Save as template" toggle when the AI detects
 * a structured routine.
 * ------------------------------------------------------------------ */
export default function WorkoutConfirmationCard({
  workout,
  askSaveTemplate,
  onConfirm,
  onEdit,
  isLogging = false,
}: Props) {
  const [saveTemplate, setSaveTemplate] = useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-orange-500 to-amber-500",
        "shadow-lg shadow-orange-200 dark:shadow-orange-900/30",
        "text-white w-full mt-2 mb-1",
      )}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-lg leading-tight">{workout.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 rounded-full px-2 py-0.5">
              {workout.type}
            </span>
            <span className="text-xs opacity-75">{workout.duration} min</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono leading-none">
            {workout.exercises.length}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-75 mt-0.5">
            exercises
          </div>
        </div>
      </div>

      {/* ── Exercise list ───────────────────────────────────── */}
      <div className="px-5 pb-3 space-y-2">
        {workout.exercises.map((ex, i) => (
          <div key={i} className="bg-white/10 rounded-xl px-3 py-2">
            <div className="font-semibold text-sm mb-1">{ex.name}</div>
            <div className="flex flex-wrap gap-1.5">
              {ex.sets.map((s, si) => (
                <span
                  key={si}
                  className="text-[11px] font-mono bg-white/20 rounded-lg px-2 py-0.5"
                >
                  {s.kg > 0 ? `${s.kg}kg × ` : ""}{s.reps}
                  {s.note ? ` (${s.note})` : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Notes ──────────────────────────────────────────── */}
      {workout.notes && (
        <div className="px-5 pb-3 text-[11px] opacity-75 italic leading-relaxed">
          {workout.notes}
        </div>
      )}

      {/* ── Save as template toggle ─────────────────────────── */}
      {askSaveTemplate && (
        <div className="px-5 pb-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white/10 rounded-xl px-3 py-2.5">
            <div
              onClick={() => setSaveTemplate((v) => !v)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors flex-shrink-0 relative",
                saveTemplate ? "bg-white" : "bg-white/30",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-orange-600 shadow transition-transform",
                  saveTemplate ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </div>
            <span className="text-xs font-semibold">
              Save as reusable template
            </span>
          </label>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-1 flex gap-2">
        <button
          onClick={() => onConfirm(saveTemplate)}
          disabled={isLogging}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-sm",
            "bg-white text-orange-600",
            "hover:bg-orange-50 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isLogging ? "Logging…" : "Log Workout ✓"}
        </button>
        <button
          onClick={onEdit}
          disabled={isLogging}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-sm",
            "bg-white/20 text-white",
            "hover:bg-white/30 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
