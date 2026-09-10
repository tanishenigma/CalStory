"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Calendar,
  Scale,
  Utensils,
  Dumbbell,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
import { toast } from "sonner";

interface ExportProgressModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportAccess = "checking" | "allowed" | "upgrade";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function ExportProgressModal({
  open,
  onClose,
}: ExportProgressModalProps) {
  const { state } = useApp();
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [access, setAccess] = useState<ExportAccess>("checking");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setAccess("checking");

    async function checkExportAccess() {
      if (!user) {
        if (!cancelled) setAccess("upgrade");
        return;
      }

      try {
        const token = await getIdToken(user);
        const response = await fetch("/api/billing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Billing lookup failed");
        const data = (await response.json()) as { plan?: string };
        if (!cancelled) {
          setAccess(
            data.plan === "plus" || data.plan === "pro" ? "allowed" : "upgrade",
          );
        }
      } catch {
        // Export access is paid-only. If the plan cannot be verified, keep
        // the export locked rather than allowing an unverified download.
        if (!cancelled) setAccess("upgrade");
      }
    }

    void checkExportAccess();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  // ── 1. Daily Summary CSV ──────────────────────────────────────────
  function exportDailySummary() {
    setDownloading("daily");
    try {
      const allDates = new Set<string>();
      if (state.meals) {
        Object.keys(state.meals).forEach((d) => allDates.add(d));
      }
      if (state.weightLogs) {
        state.weightLogs.forEach((w) => allDates.add(w.date));
      }
      if (state.fitnessLogs) {
        Object.keys(state.fitnessLogs).forEach((d) => allDates.add(d));
      }

      const sortedDates = Array.from(allDates).sort().reverse();
      const rows: string[] = [
        [
          "Date",
          "Calories In (kcal)",
          "Protein (g)",
          "Carbs (g)",
          "Fat (g)",
          "Logged Weight (kg)",
          "TDEE (kcal)",
          "Steps",
          "Calories Burned (Active)",
        ]
          .map(escapeCsv)
          .join(","),
      ];

      sortedDates.forEach((date) => {
        const dayMeals = state.meals?.[date] || [];
        const cal = dayMeals.reduce((sum, m) => sum + (m.cal || 0), 0);
        const p = dayMeals.reduce((sum, m) => sum + (m.p || 0), 0);
        const c = dayMeals.reduce((sum, m) => sum + (m.c || 0), 0);
        const f = dayMeals.reduce((sum, m) => sum + (m.f || 0), 0);

        const weightLog = state.weightLogs?.find((w) => w.date === date);
        const weightKg = weightLog ? weightLog.weight : "";

        const fitLog = state.fitnessLogs?.[date];
        const steps = fitLog?.steps ?? "";
        const burned = fitLog?.activeCalories ?? "";

        rows.push(
          [
            date,
            cal || "",
            p ? p.toFixed(1) : "",
            c ? c.toFixed(1) : "",
            f ? f.toFixed(1) : "",
            weightKg,
            state.profile?.tdee || "",
            steps,
            burned,
          ]
            .map(escapeCsv)
            .join(","),
        );
      });

      triggerDownload(
        rows.join("\n"),
        `calstory-daily-progress-${todayStr}.csv`,
        "text/csv;charset=utf-8;",
      );
      toast.success("Daily progress summary exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export daily progress");
    } finally {
      setDownloading(null);
    }
  }

  // ── 2. Weight History CSV ─────────────────────────────────────────
  function exportWeightHistory() {
    setDownloading("weight");
    try {
      const logs = [...(state.weightLogs || [])].sort((a, b) =>
        b.date.localeCompare(a.date),
      );

      const rows: string[] = [
        ["Date", "Weight (kg)", "Logged Unit", "Note"].map(escapeCsv).join(","),
      ];

      logs.forEach((w) => {
        rows.push(
          [w.date, w.weight, w.weightUnit || "kg", w.note || ""]
            .map(escapeCsv)
            .join(","),
        );
      });

      triggerDownload(
        rows.join("\n"),
        `calstory-weight-history-${todayStr}.csv`,
        "text/csv;charset=utf-8;",
      );
      toast.success("Weight history exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export weight history");
    } finally {
      setDownloading(null);
    }
  }

  // ── 3. Meals Log CSV ──────────────────────────────────────────────
  function exportMealsHistory() {
    setDownloading("meals");
    try {
      const rows: string[] = [
        [
          "Date",
          "Meal Type",
          "Food / Recipe Name",
          "Calories (kcal)",
          "Protein (g)",
          "Carbs (g)",
          "Fat (g)",
        ]
          .map(escapeCsv)
          .join(","),
      ];

      const dates = Object.keys(state.meals || {})
        .sort()
        .reverse();
      dates.forEach((date) => {
        const meals = state.meals[date] || [];
        meals.forEach((m) => {
          rows.push(
            [
              date,
              m.time || "",
              m.name,
              m.cal || 0,
              m.p || 0,
              m.c || 0,
              m.f || 0,
            ]
              .map(escapeCsv)
              .join(","),
          );
        });
      });

      triggerDownload(
        rows.join("\n"),
        `calstory-meals-history-${todayStr}.csv`,
        "text/csv;charset=utf-8;",
      );
      toast.success("Meals history exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export meals history");
    } finally {
      setDownloading(null);
    }
  }

  // ── 4. Workouts History CSV ───────────────────────────────────────
  function exportWorkoutsHistory() {
    setDownloading("workouts");
    try {
      const rows: string[] = [
        [
          "Date",
          "Workout Name",
          "Type",
          "Duration (min)",
          "Exercises Count",
          "Notes",
        ]
          .map(escapeCsv)
          .join(","),
      ];

      const dates = Object.keys(state.workouts || {})
        .sort()
        .reverse();
      dates.forEach((date) => {
        const workouts = state.workouts[date] || [];
        workouts.forEach((w) => {
          rows.push(
            [
              date,
              w.name,
              w.type || "",
              w.duration || "",
              w.exercises?.length || 0,
              w.notes || "",
            ]
              .map(escapeCsv)
              .join(","),
          );
        });
      });

      triggerDownload(
        rows.join("\n"),
        `calstory-workouts-history-${todayStr}.csv`,
        "text/csv;charset=utf-8;",
      );
      toast.success("Workouts history exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export workouts history");
    } finally {
      setDownloading(null);
    }
  }

  // ── 5. Full Raw Backup JSON ───────────────────────────────────────
  function exportFullJson() {
    setDownloading("json");
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        profile: state.profile ?? null,
        weightLogs: state.weightLogs ?? [],
        meals: state.meals ?? {},
        workouts: state.workouts ?? {},
        savedWorkouts: state.savedWorkouts ?? [],
        fitnessLogs: state.fitnessLogs ?? {},
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      triggerDownload(
        jsonStr,
        `calstory-backup-${todayStr}.json`,
        "application/json",
      );
      toast.success("Full data backup exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export JSON backup");
    } finally {
      setDownloading(null);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-progress-title"
          onMouseDown={(event) => event.stopPropagation()}
          className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Download className="w-5 h-5" />
                </span>
                <h2
                  id="export-progress-title"
                  className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Export Progress Data
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Download your nutrition, weigh-ins, and fitness logs as CSV or
                JSON for analysis or backups.
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {access === "checking" && (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-2 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading Data...</p>
            </div>
          )}

          {access === "upgrade" && (
            <div className="flex min-h-52 flex-col items-center justify-center px-2 text-center sm:px-4">
              <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Upgrade to export your data
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Data exports are available on Plus and Pro plans. Upgrade to
                download your progress and keep a copy of your records.
              </p>
              <a
                href="/pricing#pricing"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                View upgrade plans
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Export Options Grid */}
          {access === "allowed" && (
            <div
              className="min-h-0 flex-1 overflow-y-auto pt-5 space-y-3"
              data-lenis-prevent>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CSV Spreadsheet Exports
              </h3>

              {/* Daily Progress Summary */}
              <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Daily Progress Summary
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Calories in, macros, weigh-ins, TDEE & steps per day
                    </p>
                  </div>
                </div>
                <button
                  disabled={downloading === "daily"}
                  onClick={exportDailySummary}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {downloading === "daily" ? "Exporting..." : "CSV"}
                </button>
              </div>

              {/* Weight Logs */}
              <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Weight History
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      All weigh-in logs, units, and progress timestamps
                    </p>
                  </div>
                </div>
                <button
                  disabled={downloading === "weight"}
                  onClick={exportWeightHistory}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/80 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {downloading === "weight" ? "Exporting..." : "CSV"}
                </button>
              </div>

              {/* Meals Log */}
              <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Meals & Nutrition Logs
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Every meal, recipe, and food entry with full macro
                      breakdown
                    </p>
                  </div>
                </div>
                <button
                  disabled={downloading === "meals"}
                  onClick={exportMealsHistory}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/80 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {downloading === "meals" ? "Exporting..." : "CSV"}
                </button>
              </div>

              {/* Workouts Log */}
              <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Workouts & Exercises
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Logged workout sessions, exercises, sets, and notes
                    </p>
                  </div>
                </div>
                <button
                  disabled={downloading === "workouts"}
                  onClick={exportWorkoutsHistory}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted/80 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {downloading === "workouts" ? "Exporting..." : "CSV"}
                </button>
              </div>

              {/* Complete JSON Backup */}
              <div className="pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Complete Backup
                </h3>
                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 transition-colors hover:bg-primary/10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Full JSON Data Backup
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Raw JSON export containing your entire account data
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={downloading === "json"}
                    onClick={exportFullJson}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto sm:py-1.5">
                    <Download className="w-3.5 h-3.5" />
                    {downloading === "json" ? "Exporting..." : "JSON"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          {access === "allowed" && (
            <div className="mt-4 flex shrink-0 flex-col items-stretch gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"></div>
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-muted/60 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:w-auto sm:py-1.5">
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
