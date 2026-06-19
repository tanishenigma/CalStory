"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import type { PendingMeal } from "@/app/types";

interface Props {
  meal: PendingMeal;
  onConfirm: () => void;
  onEdit: () => void;
  /** Shows a subtle spinner on the Confirm button while persisting */
  isLogging?: boolean;
}

/* ------------------------------------------------------------------
 * MealConfirmationCard
 *
 * Rendered inside the AI chat panel when Gemini returns a meal
 * estimate. Uses a warm orange/amber gradient to stand out from the
 * neutral chat bubbles.
 * ------------------------------------------------------------------ */
export default function MealConfirmationCard({
  meal,
  onConfirm,
  onEdit,
  isLogging = false,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-orange-500 to-amber-500",
        "shadow-lg shadow-orange-200 dark:shadow-orange-900/30",
        "text-white",
        "w-full mt-2 mb-1",
      )}
    >
      {/* ── Calorie hero ─────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-4xl font-bold font-mono leading-none">
            {meal.cal}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-75 mt-0.5">
            kcal
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-base leading-snug">{meal.name}</div>
          <div className="text-xs opacity-75 capitalize mt-0.5">{meal.time}</div>
        </div>
      </div>

      {/* ── Macro pills ─────────────────────────────────────── */}
      <div className="px-5 pb-3 flex gap-2">
        {[
          { label: "Protein", value: meal.p },
          { label: "Carbs", value: meal.c },
          { label: "Fat", value: meal.f },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center"
          >
            <div className="font-bold text-sm">{value}g</div>
            <div className="text-[10px] opacity-80 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* ── AI comment ──────────────────────────────────────── */}
      {meal.aiComment && (
        <div className="px-5 pb-3 text-[11px] opacity-75 italic leading-relaxed">
          {meal.aiComment}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-1 flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLogging}
          className={cn(
            "flex-1 py-2.5 rounded-xl font-bold text-sm",
            "bg-white text-orange-600",
            "hover:bg-orange-50 transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isLogging ? "Logging…" : "Confirm ✓"}
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
