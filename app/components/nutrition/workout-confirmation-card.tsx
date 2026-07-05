"use client";

import React, { useState } from "react";
import { cn } from "@/app/lib/utils";
import type { PendingWorkout } from "@/app/types";
import {
  WORKOUT_METRIC_SCHEMAS,
  type MetricKey,
  type MetricFieldSchema,
} from "@/app/types";

interface Props {
  workout: PendingWorkout;
  askSaveTemplate: boolean;
  onConfirm: (saveAsTemplate: boolean) => void;
  onEdit: () => void;
  isLogging?: boolean;
  /**
   * True when this workout was loaded from one of the user's saved
   * routines. In that case the "Save as reusable template" toggle is
   * hidden by default — there's nothing new to save. The parent can
   * flip `dirty={true}` once the user edits the workout, which
   * re-shows the toggle with a "Save changes" label.
   */
  fromSavedRoutine?: boolean;
  dirty?: boolean;
  /** When true, the user has already saved this workout. The Save
   *  button becomes a non-clickable "Saved ✓" label so the user
   *  can see the action is complete (and the meal card can still
   *  be saved for mixed-intent turns). */
  alreadySaved?: boolean;
}

/* ------------------------------------------------------------------
 * WorkoutConfirmationCard
 *
 * Blue/indigo gradient card shown when the AI parses a workout.
 * Includes an optional "Save as template" toggle when the AI detects
 * a structured routine (or when the user edits a loaded routine).
 * ------------------------------------------------------------------ */
export default function WorkoutConfirmationCard({
  workout,
  askSaveTemplate,
  onConfirm,
  onEdit,
  isLogging = false,
  fromSavedRoutine = false,
  dirty = false,
  alreadySaved = false,
}: Props) {
  const [saveTemplate, setSaveTemplate] = useState(false);

  // Show the toggle when the AI recommends it OR when the user has
  // edited a previously-saved routine (so changes can be persisted).
  const showToggle = askSaveTemplate || (fromSavedRoutine && dirty);
  const toggleLabel = fromSavedRoutine
    ? "Save changes to routine"
    : "Save as reusable template";

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden ",
        "bg-gradient-to-br from-primary to-primary/70",
        "shadow-lg shadow-primary/20 dark:shadow-primary/30",
        "text-white w-full mt-2 mb-1",
      )}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 pt-5 pb-3 flex items-start justify-between gap-3">
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
        {workout.exercises.map((ex, i) => {
          const metricKey = (
            Object.keys(WORKOUT_METRIC_SCHEMAS) as MetricKey[]
          ).find((k) => k.toLowerCase() === workout.type.toLowerCase());
          const schema = metricKey
            ? WORKOUT_METRIC_SCHEMAS[metricKey]
            : ([] as MetricFieldSchema[]);

          // AI always populates the new `metrics` field for cardio-style types.
          const metrics =
            (ex.metrics as Record<string, unknown> | undefined) ?? {};

          const setChips = (ex.sets || []).map((s, si) => (
            <span
              key={si}
              className="text-[11px] font-mono bg-white/20 rounded-lg px-2 py-0.5">
              {s.kg > 0 ? `${s.kg}kg × ` : ""}
              {s.reps}
              {s.note ? ` (${s.note})` : ""}
            </span>
          ));

          const metricChips = schema
            .map((field) => {
              const raw = (metrics as any)[field.key];
              if (raw === undefined || raw === null || raw === "") return null;
              let label = "";
              if (field.kind === "number") {
                const n =
                  typeof raw === "number" ? raw : parseFloat(String(raw));
                if (!Number.isFinite(n)) return null;
                if (field.key === "paceMinPerKm" && n > 0) {
                  const mins = Math.floor(n);
                  const secs = Math.round((n - mins) * 60)
                    .toString()
                    .padStart(2, "0");
                  label = `${mins}:${secs}/km`;
                } else if (
                  field.key === "workSec" ||
                  field.key === "restSec" ||
                  field.key === "holdSec"
                ) {
                  label = `${n}s`;
                } else if (field.key === "distanceKm") {
                  label = `${n} km`;
                } else if (field.key === "calories") {
                  label = `${n} kcal`;
                } else if (
                  field.key === "weightKg" ||
                  field.key === "oneRmKg"
                ) {
                  label = `${n} kg`;
                } else {
                  label = `${field.label}: ${n}`;
                }
              } else {
                label = `${field.label}: ${raw}`;
              }
              return (
                <span
                  key={field.key}
                  className="text-[11px] font-mono bg-white/20 rounded-lg px-2 py-0.5">
                  {label}
                </span>
              );
            })
            .filter(Boolean) as React.ReactNode[];

          const durChip = ex.durationMin ? (
            <span className="text-[11px] font-mono bg-white/20 rounded-lg px-2 py-0.5">
              {ex.durationMin} min
            </span>
          ) : null;

          const allChips: React.ReactNode[] = [
            durChip,
            ...metricChips,
            ...setChips,
          ].filter(Boolean) as React.ReactNode[];

          return (
            <div key={i} className="bg-white/10 rounded-xl px-3 py-2">
              <div className="font-semibold text-sm mb-1">{ex.name}</div>
              {allChips.length === 0 ? (
                <span className="text-[11px] font-mono bg-white/20 rounded-lg px-2 py-0.5">
                  —
                </span>
              ) : (
                <div className="flex flex-wrap gap-1.5">{allChips}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Notes ──────────────────────────────────────────── */}
      {workout.notes && (
        <div className="px-5 pb-3 text-[11px] opacity-75 italic leading-relaxed">
          {workout.notes}
        </div>
      )}

      {/* ── Save as template toggle ─────────────────────────── */}
      {showToggle && (
        <div className="px-5 pb-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white/10 rounded-xl px-3 py-2.5">
            <div
              onClick={() => setSaveTemplate((v) => !v)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors flex-shrink-0 relative",
                saveTemplate ? "bg-white" : "bg-white/30",
              )}>
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-primary shadow transition-transform",
                  saveTemplate ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </div>
            <span className="text-xs font-semibold">{toggleLabel}</span>
          </label>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 pb-5 pt-1 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => onConfirm(saveTemplate)}
          disabled={isLogging || alreadySaved}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-sm",
            "bg-white text-primary",
            "hover:bg-white/90 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}>
          {alreadySaved ? "Saved ✓" : isLogging ? "Logging…" : "Save"}
        </button>
        <button
          onClick={onEdit}
          disabled={isLogging}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-sm",
            "bg-white/20 text-white",
            "hover:bg-white/30 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}>
          Edit
        </button>
      </div>
    </div>
  );
}
