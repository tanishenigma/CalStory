"use client";

import React from "react";
import { useApp, todayLocalKey } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useAuthStore } from "@/app/store/authStore";
import WeekStrip from "@/app/components/WeekStrip";
import InlineFoodSearch from "@/app/components/InlineFoodSearch";
import ManualFoodEntry from "@/app/components/ManualFoodEntry";
import AIChatLogger from "@/app/components/nutrition/ai-chat-logger";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card, CardContent } from "@/app/components/ui/card";
import { MEAL_ICONS } from "@/app/lib/constants";
import { Flame, Utensils, Sliders, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PendingMeal } from "@/app/types";

function fmtDate(key: string): string {
  if (key === todayLocalKey()) return "Today";
  return new Date(key + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function NutritionPage() {
  const { profile, isLoading } = useAuthGuard();
  const { state, deleteMeal } = useApp();
  const { user } = useAuthStore();
  const toast = useToast();
  const { selDate, meals } = state;
  const [showSearch, setShowSearch] = React.useState(false);
  const [showRecipeForm, setShowRecipeForm] = React.useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] =
    React.useState(false);
  const [showAIChat, setShowAIChat] = React.useState(false);
  const [prefillMeal, setPrefillMeal] = React.useState<PendingMeal | null>(
    null,
  );

  if (isLoading || !profile) return <Spinner variant="nutrition" />;

  const dayMeals = meals[selDate] || [];

  function handleDelete(id: string) {
    deleteMeal(id, selDate);
    toast("Meal removed", "🗑️");
  }

  // Aggregate macros and micronutrients
  const agg = dayMeals.reduce(
    (acc, meal) => {
      acc.cal += meal.cal || 0;
      acc.p += meal.p || 0;
      acc.c += meal.c || 0;
      acc.f += meal.f || 0;
      if (meal.nutrients) {
        Object.keys(meal.nutrients).forEach((k) => {
          const key = k as keyof import("@/app/types").DetailedNutrients;
          acc.nutrients[key] =
            (acc.nutrients[key] || 0) + (meal.nutrients![key] || 0);
        });
      }
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0, nutrients: {} as Record<string, number> },
  );

  const calTarget = profile.calTarget || 2000;
  const pTarget = profile.protein || 150;
  const cTarget = profile.carbs || 200;
  const fTarget = profile.fat || 65;

  const rda = {
    fiber: 28,
    sugar: 50,
    sodium: 2300, // mg
    potassium: 3400, // mg
    saturatedFat: 20,
    cholesterol: 300, // mg
    vitaminA: 900, // mcg
    vitaminC: 90, // mg
    calcium: 1300, // mg
    iron: 18, // mg
    vitaminD: 20, // mcg
    vitaminE: 15, // mg
    vitaminK: 120, // mcg
    magnesium: 400, // mg
    zinc: 11, // mg
    selenium: 55, // mcg
  };

  const getPct = (val: number, target: number) =>
    Math.min(100, Math.round((val / target) * 100));

  return (
    <>
      <WeekStrip />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="my-4 sm:my-8 text-3xl sm:text-4xl lg:text-5xl font-bold text-ink">
          Nutrition
        </h1>
        <div className="flex flex-col items-start sm:items-end gap-3">
          <div className="text-xs font-semibold text-muted-foreground">
            {fmtDate(selDate)}
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Log with AI — leftmost in the button group */}
            <button
              id="btn-log-with-ai"
              onClick={() => {
                setShowAIChat((v) => {
                  if (!v) {
                    setShowSearch(false);
                    setShowRecipeForm(false);
                  }
                  return !v;
                });
              }}
              className="px-4 py-2.5 bg-card text-ink dark:text-foreground  hover:bg-primary/10 dark:hover:bg-primary/20  rounded-xl text-xs md:text-sm font-bold shadow-sm transition-colors active:scale-[0.98] flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" />
              {showAIChat ? "Cancel" : "Log with AI"}
            </button>
            <button
              onClick={() => {
                setShowRecipeForm(!showRecipeForm);
                setShowSearch(false);
              }}
              className="px-4 py-2.5 bg-foreground text-background rounded-xl text-xs md:text-sm font-bold shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
              {showRecipeForm ? "Cancel" : "Log Food"}
            </button>
          </div>
        </div>
      </div>

      {showSearch && <InlineFoodSearch onClose={() => setShowSearch(false)} />}
      {showRecipeForm && (
        <ManualFoodEntry
          onClose={() => {
            setShowRecipeForm(false);
            setPrefillMeal(null);
          }}
          initialMeal={prefillMeal ?? undefined}
        />
      )}
      {showAIChat && user && (
        <AIChatLogger
          onClose={() => setShowAIChat(false)}
          date={selDate}
          userId={user.uid}
          onEditMeal={(meal) => {
            setPrefillMeal(meal);
            setShowAIChat(false);
            setShowRecipeForm(true);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Energy Summary */}
        <BlurFade delay={0.05} className="h-full">
          <Card className="p-6">
            <h2 className="text-sm font-bold text-ink mb-6 flex items-center gap-2">
              Energy Summary
              <span className="text-[10px] uppercase text-muted-foreground opacity-60 tracking-wider ml-auto">
                Target ➔
              </span>
            </h2>
            <div className="flex justify-between items-center gap-2 overflow-x-hidden pb-2 px-2 sm:px-4 md:px-0 md:gap-0">
              <EnergyRing
                label="Consumed"
                value={agg.cal}
                max={calTarget}
                ringColor="var(--color-primary)"
                trackColor="oklch(0.7227 0.1920 149.5793 / 0.18)"
              />
              <EnergyRing
                label="Expenditure"
                value={profile.tdee || calTarget}
                max={profile.tdee || calTarget}
                ringColor="#3b82f6"
                trackColor="rgba(59, 130, 246, 0.18)"
              />
              <EnergyRing
                label="Remaining"
                value={Math.max(0, calTarget - agg.cal)}
                max={calTarget}
                ringColor="var(--color-border)"
                trackColor="oklch(0.5517 0.0138 285.9385 / 0.12)"
                // Remaining shrinks visually as you eat — invert the fill so
                // the ring shrinks from full to empty.
                invert
              />
            </div>
          </Card>
        </BlurFade>

        {/* Targets */}
        <BlurFade delay={0.1} className="h-full">
          <Card className="p-6">
            <h2 className="text-sm font-bold text-ink mb-6 flex items-center gap-2">
              Targets
              <span className="text-[10px] uppercase text-muted-foreground opacity-60 tracking-wider ml-auto">
                Consumed ➔
              </span>
            </h2>
            <div className="space-y-4">
              <TargetRow
                label="Energy"
                current={agg.cal}
                max={calTarget}
                unit="kcal"
                color="bg-blue-500"
              />
              <TargetRow
                label="Protein"
                current={agg.p}
                max={pTarget}
                unit="g"
                color="bg-red-500"
              />
              <TargetRow
                label="Carbs"
                current={agg.c}
                max={cTarget}
                unit="g"
                color="bg-green-500"
              />
              <TargetRow
                label="Fat"
                current={agg.f}
                max={fTarget}
                unit="g"
                color="bg-yellow-500"
              />
            </div>
          </Card>
        </BlurFade>
      </div>

      {/* Meal list */}
      <BlurFade delay={0.15}>
        <h3 className="text-lg font-bold text-foreground mb-4">Logged Meals</h3>
      </BlurFade>
      {dayMeals.length === 0 ? (
        <BlurFade delay={0.2}>
          <Card className="p-6 mb-6">
            <CardContent className="p-0 text-center">
              <div className="text-3xl mb-2">🥗</div>
              <div className="font-bold text-[14px] text-foreground">
                No meals logged
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                Log Food to add your first meal of the day
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      ) : (
        <BlurFade delay={0.2}>
          <Card className="p-6 mb-6 flex flex-col">
            <CardContent className="p-0 flex flex-col">
              {dayMeals.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 py-3.5 border-b border-border last:border-b-0">
                  <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center text-foreground">
                    {React.createElement(MEAL_ICONS[m.time] || Utensils, {
                      size: 16,
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-foreground">
                      {m.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">
                      {m.time}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium mt-1">
                      P {m.p}g · C {m.c}g · F {m.f}g
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[15px] text-foreground">
                      {m.cal}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      kcal
                    </div>
                  </div>
                  <button
                    className="p-1.5 rounded-lg border border-border hover:bg-background text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete meal">
                    <svg
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </BlurFade>
      )}

      <BlurFade delay={0.25}>
        <div className="mt-8 mb-12">
          <button
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="w-full px-4 py-3 bg-card text-foreground border border-border rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
            <Sliders className="w-4 h-4" />
            {showDetailedBreakdown
              ? "Hide Detailed Breakdown"
              : "Show Detailed Breakdown"}
          </button>
        </div>
      </BlurFade>

      {showDetailedBreakdown && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Detailed Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carbohydrates */}
            <div className="bg-subtle rounded-2xl border border-border overflow-hidden">
              <div className="bg-border/50 px-4 py-2 text-xs font-bold text-foreground">
                Carbohydrates
              </div>
              <div className="p-2 space-y-1">
                <NutrientRow
                  label="Carbs"
                  value={agg.c}
                  target={cTarget}
                  unit="g"
                />
                <NutrientRow
                  label="Fiber"
                  value={agg.nutrients.fiber || 0}
                  target={rda.fiber}
                  unit="g"
                />
                <NutrientRow
                  label="Sugars"
                  value={agg.nutrients.sugar || 0}
                  target={rda.sugar}
                  unit="g"
                />
                <NutrientRow
                  label="Added Sugars"
                  value={agg.nutrients.addedSugar || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
              </div>
            </div>

            {/* Lipids */}
            <div className="bg-subtle rounded-2xl border border-border overflow-hidden">
              <div className="bg-border/50 px-4 py-2 text-xs font-bold text-foreground">
                Lipids
              </div>
              <div className="p-2 space-y-1">
                <NutrientRow
                  label="Fat"
                  value={agg.f}
                  target={fTarget}
                  unit="g"
                />
                <NutrientRow
                  label="Saturated"
                  value={agg.nutrients.saturatedFat || 0}
                  target={rda.saturatedFat}
                  unit="g"
                />
                <NutrientRow
                  label="Monounsaturated"
                  value={agg.nutrients.monoFat || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
                <NutrientRow
                  label="Polyunsaturated"
                  value={agg.nutrients.polyFat || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
                <NutrientRow
                  label="Trans Fat"
                  value={agg.nutrients.transFat || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
                <NutrientRow
                  label="Cholesterol"
                  value={agg.nutrients.cholesterol || 0}
                  target={rda.cholesterol}
                  unit="mg"
                />
              </div>
            </div>

            {/* Vitamins */}
            <div className="bg-subtle rounded-2xl border border-border overflow-hidden">
              <div className="bg-border/50 px-4 py-2 text-xs font-bold text-foreground">
                Vitamins
              </div>
              <div className="p-2 space-y-1">
                <NutrientRow
                  label="Vitamin A"
                  value={agg.nutrients.vitaminA || 0}
                  target={rda.vitaminA}
                  unit="mcg"
                />
                <NutrientRow
                  label="B Complex"
                  value={agg.nutrients.vitaminBComplex || 0}
                  target={0}
                  unit="mg"
                  hideBar
                />
                <NutrientRow
                  label="Vitamin C"
                  value={agg.nutrients.vitaminC || 0}
                  target={rda.vitaminC}
                  unit="mg"
                />
                <NutrientRow
                  label="Vitamin D"
                  value={agg.nutrients.vitaminD || 0}
                  target={rda.vitaminD}
                  unit="mcg"
                />
                <NutrientRow
                  label="Vitamin E"
                  value={agg.nutrients.vitaminE || 0}
                  target={rda.vitaminE}
                  unit="mg"
                />
                <NutrientRow
                  label="Vitamin K"
                  value={agg.nutrients.vitaminK || 0}
                  target={rda.vitaminK}
                  unit="mcg"
                />
              </div>
            </div>

            {/* Minerals */}
            <div className="bg-subtle rounded-2xl border border-border overflow-hidden">
              <div className="bg-border/50 px-4 py-2 text-xs font-bold text-foreground">
                Minerals
              </div>
              <div className="p-2 space-y-1">
                <NutrientRow
                  label="Calcium"
                  value={agg.nutrients.calcium || 0}
                  target={rda.calcium}
                  unit="mg"
                />
                <NutrientRow
                  label="Iron"
                  value={agg.nutrients.iron || 0}
                  target={rda.iron}
                  unit="mg"
                />
                <NutrientRow
                  label="Sodium"
                  value={agg.nutrients.sodium || 0}
                  target={rda.sodium}
                  unit="mg"
                />
                <NutrientRow
                  label="Potassium"
                  value={agg.nutrients.potassium || 0}
                  target={rda.potassium}
                  unit="mg"
                />
                <NutrientRow
                  label="Magnesium"
                  value={agg.nutrients.magnesium || 0}
                  target={rda.magnesium}
                  unit="mg"
                />
                <NutrientRow
                  label="Zinc"
                  value={agg.nutrients.zinc || 0}
                  target={rda.zinc}
                  unit="mg"
                />
                <NutrientRow
                  label="Selenium"
                  value={agg.nutrients.selenium || 0}
                  target={rda.selenium}
                  unit="mcg"
                />
              </div>
            </div>

            {/* Protein Quality */}
            <div className="bg-subtle rounded-2xl border border-border overflow-hidden md:col-span-2">
              <div className="bg-border/50 px-4 py-2 text-xs font-bold text-foreground">
                Protein Quality
              </div>
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <NutrientRow
                  label="Protein"
                  value={agg.p}
                  target={pTarget}
                  unit="g"
                />
                <NutrientRow
                  label="Leucine"
                  value={agg.nutrients.leucine || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
                <NutrientRow
                  label="BCAAs"
                  value={agg.nutrients.bcaas || 0}
                  target={0}
                  unit="g"
                  hideBar
                />
                <NutrientRow
                  label="Amino Acid Profile"
                  value={agg.nutrients.aminoAcidProfile || 0}
                  target={0}
                  unit="%"
                  hideBar
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TargetRow({
  label,
  current,
  max,
  unit,
  color,
  fill,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
  color?: string;
  fill?: string;
}) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="flex items-center gap-4">
      <div className="w-16 sm:w-20 text-xs font-bold text-foreground">
        {label}
      </div>
      <div className="flex-1 h-3 bg-muted dark:bg-muted rounded-full overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 h-full ${fill || color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-24 sm:w-32 text-right text-xs">
        <span className="font-bold text-foreground">
          {Math.round(current)} / {max} {unit}
        </span>
        <span className="ml-2 font-bold text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}

function NutrientRow({
  label,
  value,
  target,
  unit,
  hideBar = false,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  hideBar?: boolean;
}) {
  const pct =
    target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-background rounded-lg transition-colors min-w-0">
      <div className="text-xs text-foreground flex-1">{label}</div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-foreground w-20 text-right">
          {value.toFixed(1)} {unit}
        </div>
        {!hideBar ? (
          <>
            <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-8 text-right text-[10px] font-bold text-muted-foreground">
              {pct}%
            </div>
          </>
        ) : (
          <div className="w-[104px] text-right text-[10px] font-bold text-muted-foreground">
            -
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * EnergyRing — circular progress indicator.
 * The fill animates whenever `value` changes (e.g. when a meal is
 * logged). `invert` swaps the direction so the "Remaining" ring
 * shrinks from full to empty as calories are consumed.
 * ------------------------------------------------------------------ */
function EnergyRing({
  label,
  value,
  max,
  ringColor,
  trackColor,
  invert = false,
}: {
  label: string;
  value: number;
  max: number;
  ringColor: string;
  trackColor: string;
  invert?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const displayPct = invert ? 100 - pct : pct;

  // SVG circle math: circumference = 2 * PI * r. We use a dasharray of
  // that length and animate dashoffset to draw the stroke.
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayPct / 100);

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 600ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-base sm:text-xl text-foreground leading-none">
            {Math.round(value)}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold mt-0.5">
            kcal
          </span>
        </div>
      </div>
      <span className="text-xs font-bold text-ink mt-3">{label}</span>
    </div>
  );
}
