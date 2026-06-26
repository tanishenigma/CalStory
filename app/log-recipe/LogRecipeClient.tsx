"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, uid } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  MEAL_TIMES,
  MEAL_ICONS,
  RECIPE_PRESETS,
  SERVING_UNITS,
} from "@/app/lib/constants";
import type { MealTime, Recipe } from "@/app/types";
import { Flame, ArrowLeft } from "lucide-react";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";

/* ────────────────────────────────────────────────────────────
 * Full-page "Log Recipe" with the complete nutrient breakdown.
 *
 * Mounted at /log-recipe. Pre-fills from query string parameters
 * (e.g. when the floating panel's "Advanced" link hands off).
 * ──────────────────────────────────────────────────────────── */

export default function LogRecipePage() {
  const { profile, isLoading } = useAuthGuard();
  if (isLoading || !profile) return <Spinner />;
  return (
    <React.Suspense fallback={<Spinner />}>
      <LogRecipeForm />
    </React.Suspense>
  );
}

function LogRecipeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { addMeal, addMealForRange, state } = useApp();
  const toast = useToast();

  // ── prefill from query string ──
  const prefill = useMemo(
    () => ({
      name: params.get("name") ?? "",
      category: (params.get("category") ?? "lunch") as MealTime,
      servings: params.get("servings") ?? "1",
      servingSize: params.get("servingSize") ?? "100",
      servingUnit: (params.get("servingUnit") ?? "g") as
        | "g"
        | "ml"
        | "cup"
        | "piece",
      time: params.get("time") ?? new Date().toTimeString().slice(0, 5),
      repeat: Number(params.get("repeat") ?? "1"),
      cal: params.get("cal") ?? "",
      p: params.get("p") ?? "",
      c: params.get("c") ?? "",
      f: params.get("f") ?? "",
    }),
    [params],
  );

  // ── form state ──
  const [name, setName] = useState(prefill.name);
  const [category, setCategory] = useState<MealTime>(prefill.category);
  const [servings, setServings] = useState(prefill.servings);
  const [servingSize, setServingSize] = useState(prefill.servingSize);
  const [servingUnit, setServingUnit] = useState<"g" | "ml" | "cup" | "piece">(
    prefill.servingUnit,
  );
  const [consumptionTime, setConsumptionTime] = useState(prefill.time);
  const [repeatDays, setRepeatDays] = useState<number>(prefill.repeat);
  const [calories, setCalories] = useState(prefill.cal);
  const [p, setP] = useState(prefill.p);
  const [c, setC] = useState(prefill.c);
  const [f, setF] = useState(prefill.f);

  // detailed nutrients
  const [saturatedFat, setSaturatedFat] = useState("");
  const [transFat, setTransFat] = useState("");
  const [polyFat, setPolyFat] = useState("");
  const [monoFat, setMonoFat] = useState("");
  const [cholesterol, setCholesterol] = useState("");
  const [sodium, setSodium] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [addedSugar, setAddedSugar] = useState("");
  const [sugarAlcohols, setSugarAlcohols] = useState("");
  const [vitaminD, setVitaminD] = useState("");
  const [calcium, setCalcium] = useState("");
  const [iron, setIron] = useState("");
  const [potassium, setPotassium] = useState("");
  const [vitaminA, setVitaminA] = useState("");
  const [vitaminC, setVitaminC] = useState("");

  const num = (v: string) => parseFloat(v) || 0;

  function applyPreset(r: Recipe) {
    setName(r.name);
    setCategory(r.category);
    setServings(String(r.servings));
    setServingSize(String(r.servingSize));
    setCalories(String(r.calories));
    setP(String(r.nutrition.protein));
    setC(String(r.nutrition.carbs));
    setF(String(r.nutrition.fat));
    setSaturatedFat(String(r.nutrition.saturatedFat ?? ""));
    setTransFat(String(r.nutrition.transFat ?? ""));
    setPolyFat(String(r.nutrition.polyFat ?? ""));
    setMonoFat(String(r.nutrition.monoFat ?? ""));
    setCholesterol(String(r.nutrition.cholesterol ?? ""));
    setSodium(String(r.nutrition.sodium ?? ""));
    setFiber(String(r.nutrition.fiber ?? ""));
    setSugar(String(r.nutrition.sugar ?? ""));
    setAddedSugar(String(r.nutrition.addedSugar ?? ""));
    setSugarAlcohols(String(r.nutrition.sugarAlcohols ?? ""));
    setVitaminD(String(r.nutrition.vitaminD ?? ""));
    setCalcium(String(r.nutrition.calcium ?? ""));
    setIron(String(r.nutrition.iron ?? ""));
    setPotassium(String(r.nutrition.potassium ?? ""));
    setVitaminA(String(r.nutrition.vitaminA ?? ""));
    setVitaminC(String(r.nutrition.vitaminC ?? ""));
  }

  function autoEstimateMacros(calVal: string) {
    const kcal = num(calVal);
    if (!p && !c && !f && kcal > 0) {
      setP(String(Math.round((kcal * 0.25) / 4)));
      setC(String(Math.round((kcal * 0.5) / 4)));
      setF(String(Math.round((kcal * 0.25) / 9)));
    }
  }

  // ── derived: % daily values ──
  const profile = state.profile;
  const dailyTargets = useMemo(
    () => ({
      cal: profile?.calTarget ?? 2000,
      protein: profile?.protein ?? 50,
      carbs: profile?.carbs ?? 250,
      fat: profile?.fat ?? 70,
      satFat: 20,
      cholesterol: 300,
      sodium: 2300,
      fiber: 28,
      addedSugar: 50,
      vitaminD: 20,
      calcium: 1300,
      iron: 18,
      potassium: 4700,
      vitaminA: 900,
      vitaminC: 90,
    }),
    [profile],
  );

  const pPct =
    dailyTargets.cal > 0
      ? Math.round((num(calories) / dailyTargets.cal) * 100)
      : 0;
  const pPctP =
    dailyTargets.protein > 0
      ? Math.round((num(p) / dailyTargets.protein) * 100)
      : 0;
  const pPctC =
    dailyTargets.carbs > 0
      ? Math.round((num(c) / dailyTargets.carbs) * 100)
      : 0;
  const pPctF =
    dailyTargets.fat > 0 ? Math.round((num(f) / dailyTargets.fat) * 100) : 0;

  const netCarbs = useMemo(
    () => num(c) - num(fiber) - num(sugarAlcohols),
    [c, fiber, sugarAlcohols],
  );

  async function handleSave() {
    if (!name.trim()) {
      toast("Enter a recipe name", "⚠️");
      return;
    }
    const kcal = num(calories);
    if (!kcal) {
      toast("Enter calories", "⚠️");
      return;
    }
    const meal = {
      id: uid(),
      name: name.trim(),
      time: category,
      cal: kcal,
      p: num(p),
      c: num(c),
      f: num(f),
    };
    if (repeatDays > 1 && addMealForRange) {
      await addMealForRange(meal, repeatDays);
      toast(`${name.trim()} logged for ${repeatDays} days`, "📅");
    } else {
      await addMeal(meal);
      toast(`${name.trim()} saved!`, "🥗");
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-background flex items-center justify-center cursor-pointer transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Flame size={20} className="text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-heading">
            Log Recipe — Advanced
          </h1>
        </div>
      </div>

      {/* ── Quick presets ── */}
      <Card>
        <CardHeader>
          <CardTitle>Quick add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {RECIPE_PRESETS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyPreset(r)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-card hover:bg-background hover:border-[#1A1916] dark:hover:border-[#f7f6f3] text-xs font-semibold transition-all cursor-pointer">
                <span className="text-sm">{pairingEmojiFor(r.name)}</span>
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Basics ── */}
      <Card className="p-5">
        <div className="text-sm font-bold mb-4 text-[#1A1916] dark:text-[#f7f6f3]">
          Basics
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Recipe name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banana Shake"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
            />
          </Field>
          <Field label="Meal category">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <span className="flex items-center gap-2 flex-1 truncate">
                  {React.createElement(MEAL_ICONS[category], { size: 16 })}
                  <span className="capitalize">{category}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Meal category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {MEAL_TIMES.map((t) => {
                  const Icon = MEAL_ICONS[t];
                  return (
                    <DropdownMenuItem
                      key={t}
                      icon={<Icon size={16} />}
                      active={category === t}
                      onSelect={() => setCategory(t)}>
                      <span className="capitalize">{t}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Servings">
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
            />
          </Field>
          <Field label="Serving size">
            <input
              type="number"
              min="0"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
            />
          </Field>
          <Field label="Unit">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <span className="flex-1 capitalize">{servingUnit}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Serving unit</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SERVING_UNITS.map((u) => (
                  <DropdownMenuItem
                    key={u}
                    active={servingUnit === u}
                    onSelect={() => setServingUnit(u as typeof servingUnit)}>
                    <span className="capitalize">{u}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Consumed at">
            <input
              type="time"
              value={consumptionTime}
              onChange={(e) => setConsumptionTime(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all"
            />
          </Field>
          <Field label="Log for next">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <span className="flex-1">
                  {repeatDays === 1 ? "1 day" : `${repeatDays} days`}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Log for multiple days</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[1, 2, 3, 5, 7].map((d) => (
                  <DropdownMenuItem
                    key={d}
                    active={repeatDays === d}
                    onSelect={() => setRepeatDays(d)}>
                    {d === 1 ? "1 day (today only)" : `${d} days`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </div>

        <div className="mb-3">
          <Field label="Calories per serving" hint="kcal">
            <div className="relative">
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => {
                  setCalories(e.target.value);
                  autoEstimateMacros(e.target.value);
                }}
                placeholder="e.g. 420"
                className="w-full px-3.5 py-3 pr-14 border border-border rounded-lg text-sm bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[#9B9895]">
                kcal
              </span>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-1">
          <Field label="Protein" hint="g" compact>
            <input
              type="number"
              min="0"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="0"
              className="w-full px-2.5 py-2.5 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
            />
          </Field>
          <Field label="Carbs" hint="g" compact>
            <input
              type="number"
              min="0"
              value={c}
              onChange={(e) => setC(e.target.value)}
              placeholder="0"
              className="w-full px-2.5 py-2.5 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
            />
          </Field>
          <Field label="Fat" hint="g" compact>
            <input
              type="number"
              min="0"
              value={f}
              onChange={(e) => setF(e.target.value)}
              placeholder="0"
              className="w-full px-2.5 py-2.5 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
            />
          </Field>
        </div>
        <p className="text-[11px] text-[#9B9895]">
          💡 Macros auto-estimated from calories if left blank
        </p>
      </Card>

      {/* ── % of daily target ── */}
      <Card>
        <CardHeader>
          <CardTitle>% of daily target</CardTitle>
        </CardHeader>
        <CardContent>
          <DVBar label="Calories" pct={pPct} color="#1A1916" />
          <DVBar label="Protein" pct={pPctP} color="#EF4444" />
          <DVBar label="Carbs" pct={pPctC} color="#4ADE80" />
          <DVBar label="Fat" pct={pPctF} color="#FACC15" />
        </CardContent>
      </Card>

      {/* ── Detailed nutrients ── */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed nutrients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Section title="Fats breakdown">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Saturated" hint="g" compact>
                <input
                  type="number"
                  value={saturatedFat}
                  onChange={(e) => setSaturatedFat(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Trans" hint="g" compact>
                <input
                  type="number"
                  value={transFat}
                  onChange={(e) => setTransFat(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Polyunsaturated" hint="g" compact>
                <input
                  type="number"
                  value={polyFat}
                  onChange={(e) => setPolyFat(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Monounsaturated" hint="g" compact>
                <input
                  type="number"
                  value={monoFat}
                  onChange={(e) => setMonoFat(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
            </div>
          </Section>

          <Section title="Cholesterol & sodium">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Cholesterol" hint="mg" compact>
                <input
                  type="number"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Sodium" hint="mg" compact>
                <input
                  type="number"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Carbs breakdown"
            footer={
              netCarbs > 0 ? (
                <div className="flex justify-between text-[11px] pt-2 border-t border-border mt-2">
                  <span className="font-semibold text-[#1A1916] dark:text-[#f7f6f3]">
                    Net carbs
                  </span>
                  <span className="font-mono text-[#1A1916] dark:text-[#f7f6f3]">
                    {netCarbs.toFixed(1)} g
                  </span>
                </div>
              ) : null
            }>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Fiber" hint="g" compact>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Sugar" hint="g" compact>
                <input
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Added sugars" hint="g" compact>
                <input
                  type="number"
                  value={addedSugar}
                  onChange={(e) => setAddedSugar(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Sugar alcohols" hint="g" compact>
                <input
                  type="number"
                  value={sugarAlcohols}
                  onChange={(e) => setSugarAlcohols(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
            </div>
          </Section>

          <Section title="Micronutrients">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vitamin D" hint="mcg" compact>
                <input
                  type="number"
                  value={vitaminD}
                  onChange={(e) => setVitaminD(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Calcium" hint="mg" compact>
                <input
                  type="number"
                  value={calcium}
                  onChange={(e) => setCalcium(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Iron" hint="mg" compact>
                <input
                  type="number"
                  value={iron}
                  onChange={(e) => setIron(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Potassium" hint="mg" compact>
                <input
                  type="number"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Vitamin A" hint="mcg" compact>
                <input
                  type="number"
                  value={vitaminA}
                  onChange={(e) => setVitaminA(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
              <Field label="Vitamin C" hint="mg" compact>
                <input
                  type="number"
                  value={vitaminC}
                  onChange={(e) => setVitaminC(e.target.value)}
                  className="w-full px-2.5 py-2 border border-border rounded-md text-xs bg-background focus:bg-card focus:border-border outline-none transition-all font-mono"
                />
              </Field>
            </div>
          </Section>
        </CardContent>
      </Card>

      {/* ── Save / Cancel ── */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSave}
          type="button"
          className="w-full py-3.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] border-0 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
          {repeatDays > 1 ? `Save to next ${repeatDays} days` : "Save Meal"}
        </button>
        <button
          onClick={() => router.back()}
          type="button"
          className="w-full py-3.5 border border-border text-[#9B9895] rounded-xl text-sm font-semibold hover:bg-background active:scale-[0.99] transition-all cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── small field components ─────────────────────────────── */

function Field({
  label,
  hint,
  compact,
  children,
}: {
  label: string;
  hint?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`flex items-baseline justify-between font-bold uppercase tracking-wider text-[#9B9895] ${compact ? "text-[9px] mb-1" : "text-[10px] mb-1.5"}`}>
        <span>{label}</span>
        {hint && (
          <span className="font-mono normal-case text-[#9B9895]/70">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Section({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] mb-2">
        {title}
      </div>
      {children}
      {footer}
    </div>
  );
}

function DVBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(pct, 999));
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-xs font-semibold text-[#1A1916] dark:text-[#f7f6f3] w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(clamped, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-[#1A1916] dark:text-[#f7f6f3] w-9 text-right">
        {clamped}%
      </span>
    </div>
  );
}

function pairingEmojiFor(name: string): string {
  const map: Record<string, string> = {
    "Boiled Egg": "🥚",
    "Dal 1 bowl": "🍲",
    Banana: "🍌",
    "Rice 1 cup": "🍚",
    "Whey Shake": "🥛",
    "Paneer 100g": "🧀",
    "Paneer Biryani": "🍛",
    "Greek Salad": "🥗",
  };
  return map[name] ?? "🍽️";
}
