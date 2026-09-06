"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { toast } from "sonner";

interface ExportProgressModalProps {
  open: boolean;
  onClose: () => void;
}

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

export function ExportProgressModal({ open, onClose }: ExportProgressModalProps) {
  const { state } = useApp();
  const [downloading, setDownloading] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

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

      const dates = Object.keys(state.meals || {}).sort().reverse();
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

      const dates = Object.keys(state.workouts || {}).sort().reverse();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-7"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Download className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
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
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Export Options Grid */}
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CSV Spreadsheet Exports
            </h3>

            {/* Daily Progress Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloading === "daily" ? "Exporting..." : "CSV"}
              </button>
            </div>

            {/* Weight Logs */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border text-foreground hover:bg-muted/80 active:scale-95 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloading === "weight" ? "Exporting..." : "CSV"}
              </button>
            </div>

            {/* Meals Log */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Meals & Nutrition Logs
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Every meal, recipe, and food entry with full macro breakdown
                  </p>
                </div>
              </div>
              <button
                disabled={downloading === "meals"}
                onClick={exportMealsHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border text-foreground hover:bg-muted/80 active:scale-95 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloading === "meals" ? "Exporting..." : "CSV"}
              </button>
            </div>

            {/* Workouts Log */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-card border border-border text-foreground hover:bg-muted/80 active:scale-95 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {downloading === "workouts" ? "Exporting..." : "CSV"}
              </button>
            </div>

            {/* Complete JSON Backup */}
            <div className="pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Complete Backup
              </h3>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-3">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading === "json" ? "Exporting..." : "JSON"}
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Exports run client-side — your private data stays secure</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
