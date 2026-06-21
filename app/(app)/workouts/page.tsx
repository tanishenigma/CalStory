"use client";

import React from "react";
import { useApp, todayLocalKey } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { useToast } from "@/app/components/ToastContainer";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import WeekStrip from "@/app/components/WeekStrip";
import { Card } from "@/app/components/ui/card";
import WorkoutForm from "@/app/components/WorkoutForm";
import AIWorkoutLogger from "@/app/components/nutrition/ai-workout-logger";
import { Pencil, CopyPlus, Trash2, X, Eye, Sparkles } from "lucide-react";
import type { PendingWorkout } from "@/app/types";
import {
  WORKOUT_METRIC_SCHEMAS,
  type MetricKey,
  type MetricFieldSchema,
} from "@/app/types";

function fmtDate(key: string): string {
  if (key === todayLocalKey()) return "Today";
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Short label for a metric value (e.g. "5.2 km" or "21–18"). */
function formatMetricValue(field: MetricFieldSchema, raw: unknown): string {
  if (raw === undefined || raw === null || raw === "") return "";
  if (field.kind === "number") {
    const n = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (!Number.isFinite(n)) return String(raw);
    if (field.key === "paceMinPerKm" && n > 0) {
      const mins = Math.floor(n);
      const secs = Math.round((n - mins) * 60)
        .toString()
        .padStart(2, "0");
      return `${mins}:${secs}/km`;
    }
    if (
      field.key === "workSec" ||
      field.key === "restSec" ||
      field.key === "holdSec"
    ) {
      return `${n}s`;
    }
    if (field.key === "distanceKm") return `${n} km`;
    if (field.key === "calories") return `${n} kcal`;
    if (field.key === "weightKg" || field.key === "oneRmKg") return `${n} kg`;
    return `${n}`;
  }
  return String(raw);
}

/** Render the per-exercise summary line(s) for any workout type. */
function ExerciseDetails({
  ex,
  workoutType,
  fontMonoClass,
}: {
  ex: any;
  workoutType?: string;
  fontMonoClass: string;
}) {
  const lines: React.ReactNode[] = [];

  // Per-exercise duration (always rendered when present).
  if (ex.durationMin) lines.push(`${ex.durationMin} min`);

  // Resolve metric block: prefer the new `metrics` field, fall back
  // to the legacy `cardio` block for older records.
  const legacyCardio = ex.cardio as Record<string, unknown> | undefined;
  const metrics =
    (ex.metrics as Record<string, unknown> | undefined) ??
    (legacyCardio ? { ...legacyCardio } : undefined);

  // Pick the right schema by workout type, but fall back to scanning
  // any known field present so legacy data still renders nicely.
  let schema: MetricFieldSchema[] = [];
  if (workoutType) {
    const key = (Object.keys(WORKOUT_METRIC_SCHEMAS) as MetricKey[]).find(
      (k) => k.toLowerCase() === workoutType.toLowerCase(),
    );
    if (key) schema = WORKOUT_METRIC_SCHEMAS[key];
  }
  // For unknown types (incl. legacy), include any field present in metrics.
  if (!schema.length && metrics) {
    schema = Object.keys(metrics).map((k) => ({
      key: k,
      label: k,
      kind: typeof metrics[k] === "number" ? "number" : "text",
    }));
  }

  if (schema.length && metrics) {
    for (const field of schema) {
      if (metrics[field.key] === undefined) continue;
      const formatted = formatMetricValue(field, metrics[field.key]);
      if (!formatted) continue;
      lines.push(`${field.label}: ${formatted}`);
    }
  }

  // Set entries (resistance-style types).
  if (ex.sets && ex.sets.length > 0) {
    if (lines.length > 0) lines.push(""); // blank line separator
    ex.sets.forEach((s: any, sIdx: number) => {
      lines.push(`Set ${sIdx + 1}: ${s.reps} reps @ ${s.kg}kg`);
    });
  }

  if (lines.length === 0) {
    return (
      <div className={fontMonoClass}>
        {(ex.reps || []).length}×{(ex.reps || []).join("/")} @ {ex.kg || 0}kg
      </div>
    );
  }

  return (
    <>
      {lines.map((line, i) =>
        line === "" ? (
          <div key={i} className="h-1" />
        ) : (
          <div key={i} className={fontMonoClass}>
            {line}
          </div>
        ),
      )}
    </>
  );
}

export default function WorkoutsPage() {
  const { profile, isLoading } = useAuthGuard();
  const { state, deleteWorkout, deleteTemplate } = useApp();
  const { user } = useAuthStore();
  const toast = useToast();
  const { selDate, workouts } = state;
  const [showForm, setShowForm] = React.useState(false);
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [editingWorkout, setEditingWorkout] = React.useState<any>(null);
  const [formMode, setFormMode] = React.useState<"new" | "edit" | "duplicate">(
    "new",
  );
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [viewingTemplate, setViewingTemplate] = React.useState<any>(null);

  if (isLoading || !profile) return <Spinner />;

  const dayWorkouts = workouts[selDate] || [];

  function handleDelete(id: string) {
    deleteWorkout(id, selDate);
    toast("Workout removed", "🗑️");
  }

  return (
    <>
      <WeekStrip />
      <div className="flex flex-col sm:flex-row sm:items-center  justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <div className="flex flex-start items-center gap-4">
            <h1 className="my-4 sm:my-8 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              Workouts
            </h1>{" "}
            {state.savedWorkouts?.length > 0 && (
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 h-10 py-2.5 bg-primary-foreground  dark:bg-muted text-foreground dark:text-foreground border border-border rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-background transition-colors active:scale-[0.98]">
                Saved Routines
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          <div className="text-xs font-semibold text-[#9B9895]">
            {fmtDate(selDate)}
          </div>
          <div className="flex gap-2 flex-wrap ">
            {/* Log with AI — blue accent, left of primary Log Workout button */}
            {user && (
              <button
                id="btn-log-workout-ai"
                onClick={() => {
                  setShowAIChat((v) => {
                    if (!v) {
                      setShowForm(false);
                      setShowTemplates(false);
                    }
                    return !v;
                  });
                }}
                className="px-4 py-2.5 bg-card text-ink dark:text-[#f7f6f3]  rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors active:scale-[0.98] flex items-center gap-1.5">
                <Sparkles size={14} className="text-orange-500" />
                {showAIChat ? "Cancel" : "Log with AI"}
              </button>
            )}
            <button
              onClick={() => {
                setEditingWorkout(null);
                setFormMode("new");
                setShowForm(true);
                setShowTemplates(false);
                setShowAIChat(false);
              }}
              className="px-4 py-2.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl text-xs md:text-sm font-bold shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
              Log Workout
            </button>
          </div>
        </div>
      </div>{" "}
      {showTemplates && !showForm && (
        <div className="mb-4 p-6 bg-card dark:bg-card rounded-[24px] shadow-sm border border-[#F0EFEC] dark:border-[#2a2a2a] animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              Saved Routines
            </h2>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-[#9B9895] hover:text-[#1A1916]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {state.savedWorkouts.map((t) => (
              <div
                key={t.id}
                className="p-4 border border-border rounded-2xl flex flex-col hover:bg-subtle transition-colors min-w-0">
                <div className="flex justify-between items-start gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[15px] text-[#1A1916] dark:text-[#f7f6f3] truncate">
                      {t.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-background text-[#9B9895] text-[10px] font-bold uppercase tracking-wider">
                        {t.type}
                      </span>
                      <span className="text-xs font-semibold text-[#9B9895]">
                        {t.exercises.length} Exercises
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setViewingTemplate(
                          viewingTemplate?.id === t.id ? null : t,
                        )
                      }
                      className={`p-2 rounded-lg transition-colors ${viewingTemplate?.id === t.id ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]" : "text-[#9B9895] hover:text-[#1A1916] dark:text-[#f7f6f3] hover:bg-background dark:bg-[#0f0f0e]"}`}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingWorkout(t);
                        setFormMode("duplicate");
                        setShowForm(true);
                        setShowTemplates(false);
                      }}
                      className="px-4 py-2 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                      Use
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this template?")) {
                          deleteTemplate(t.id);
                        }
                      }}
                      className="p-2 text-[#9B9895] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {viewingTemplate?.id === t.id && (
                  <div className="mt-4 pt-3 border-t border-[#F0EFEC] dark:border-[#2a2a2a] flex flex-col gap-3">
                    {t.exercises.map((e: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1 py-1">
                        <div className="font-semibold text-[#1A1916] dark:text-[#f7f6f3] text-[13px]">
                          {e.name}
                        </div>
                        <div className="flex flex-col pl-3 border-l-2 border-border gap-0.5">
                          <ExerciseDetails
                            ex={e}
                            workoutType={t.type}
                            fontMonoClass="font-mono text-[#9B9895] text-[11px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* AI workout logger — inline, appears below button row */}
      {showAIChat && user && (
        <AIWorkoutLogger
          onClose={() => setShowAIChat(false)}
          date={selDate}
          userId={user.uid}
          onEditWorkout={(workout: PendingWorkout) => {
            // Convert PendingWorkout → WorkoutForm initialWorkout shape
            setEditingWorkout({
              id: "",
              name: workout.name,
              type: workout.type,
              duration: workout.duration,
              exercises: workout.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets.map((s) => ({ reps: s.reps, kg: s.kg })),
                reps: ex.sets.map((s) => s.reps),
                kg: ex.sets[0]?.kg ?? 0,
              })),
              notes: workout.notes,
            });
            setFormMode("new");
            setShowForm(true);
            setShowAIChat(false);
          }}
        />
      )}
      {showForm && (
        <div className="mb-8">
          <WorkoutForm
            onClose={() => setShowForm(false)}
            initialWorkout={editingWorkout}
            mode={formMode}
          />
        </div>
      )}
      {dayWorkouts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <div className="text-4xl mb-2">💤</div>
          <div className="font-bold text-[15px] text-[#1A1916] dark:text-[#f7f6f3]">
            Rest Day
          </div>
          <div className="text-[13px] text-[#9B9895] max-w-[200px]">
            No workouts logged for this day. Enjoy your recovery!
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {dayWorkouts.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-[15px] text-[#1A1916] dark:text-[#f7f6f3] truncate">
                    {w.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center justify-center px-2 py-0.5 rounded bg-background text-[#9B9895] text-[10px] font-bold uppercase tracking-wider">
                      {w.type}
                    </span>
                    <span className="text-xs font-semibold text-[#9B9895]">
                      {w.duration} min
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="p-2.5 sm:p-1.5 text-[#9B9895] hover:text-[#1A1916] hover:bg-background rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => {
                      setEditingWorkout(w);
                      setFormMode("edit");
                      setShowForm(true);
                    }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 sm:p-1.5 text-[#9B9895] hover:text-[#1A1916] hover:bg-background rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => {
                      setEditingWorkout(w);
                      setFormMode("duplicate");
                      setShowForm(true);
                    }}>
                    <CopyPlus className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 sm:p-1.5 text-[#9B9895] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    onClick={() => handleDelete(w.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {(w.exercises || []).length > 0 && (
                <div className="mt-4 pt-2 border-t border-[#F0EFEC] dark:border-[#2a2a2a] flex flex-col gap-2">
                  {w.exercises.map((e, i) => (
                    <div key={i} className="flex flex-col gap-1 py-1">
                      <div className="font-semibold text-[#1A1916] dark:text-[#f7f6f3] text-xs">
                        {e.name}
                      </div>
                      <div className="flex flex-col pl-3 border-l-2 border-[#F0EFEC] dark:border-[#2a2a2a] gap-0.5">
                        <ExerciseDetails
                          ex={e}
                          workoutType={w.type}
                          fontMonoClass="font-mono text-[#9B9895] text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {w.notes && (
                <div className="mt-4 p-3 bg-background rounded-xl text-xs text-[#9B9895] leading-relaxed italic">
                  {w.notes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
