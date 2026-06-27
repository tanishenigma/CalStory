"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { useApp, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type {
  Meal,
  MealTime,
  PendingMeal,
  DetailedNutrients,
} from "@/app/types";

interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_description: string;
}

interface FoodData {
  food_id: string;
  food_name: string;
  perGram: Record<string, number>;
  optionsGroups: {
    group: string;
    options: { label: string; value: string; factor: number }[];
  }[];
}

interface Props {
  onClose: () => void;

  initialMeal?: PendingMeal;
}

export default function ManualFoodEntry({ onClose, initialMeal }: Props) {
  const { addMeal } = useApp();

  // ── Mode ─────────────────────────────────────────────────────────────
  // "search" = API-driven flow with serving picker
  // "manual" = pure manual macro entry
  const [mode, setMode] = useState<"search" | "manual">("search");

  // ── Shared ───────────────────────────────────────────────────────────
  const [time, setTime] = useState<MealTime>(initialMeal?.time ?? "lunch");

  // ── Manual-mode state ────────────────────────────────────────────────
  const [name, setName] = useState(initialMeal?.name ?? "");
  const [cal, setCal] = useState(
    initialMeal?.cal ? String(initialMeal.cal) : "",
  );
  const [p, setP] = useState(initialMeal?.p ? String(initialMeal.p) : "");
  const [c, setC] = useState(initialMeal?.c ? String(initialMeal.c) : "");
  const [f, setF] = useState(initialMeal?.f ? String(initialMeal.f) : "");

  // ── Search-mode state ────────────────────────────────────────────────
  const [query, setQuery] = useState(initialMeal?.name ?? "");
  const [results, setResults] = useState<FatSecretFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFoodData, setSelectedFoodData] = useState<FoodData | null>(
    null,
  );
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [quantity, setQuantity] = useState("100");

  // ── Pre-fill from AI chat (initialMeal) ──────────────────────────────
  // When initialMeal arrives with a name, kick off a search immediately
  useEffect(() => {
    if (initialMeal?.name && initialMeal.name.trim().length >= 3) {
      setQuery(initialMeal.name);
    }
  }, [initialMeal?.name]);

  // ── Debounced API search ─────────────────────────────────────────────
  useEffect(() => {
    // Skip search in manual mode or if a food is already selected
    if (mode !== "search" || selectedFoodData) return;

    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length < 3) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/food/search?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        const foods = data?.foods?.food || [];
        setResults(Array.isArray(foods) ? foods : [foods]);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, mode, selectedFoodData]);

  // ── Fetch food details and build serving picker ──────────────────────
  async function handleSelectFood(foodId: string, foodName: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/food/details?id=${foodId}`);
      const data = await res.json();

      const food = data?.food;
      if (!food || !food.servings || !food.servings.serving) {
        toast.warning("Nutritional data unavailable");
        return;
      }

      const servings = Array.isArray(food.servings.serving)
        ? food.servings.serving
        : [food.servings.serving];

      let baseServing =
        servings.find(
          (s: any) => s.metric_serving_unit === "g" && s.metric_serving_amount,
        ) || servings[0];
      let baseGrams = parseFloat(baseServing.metric_serving_amount || "100");
      if (isNaN(baseGrams) || baseGrams <= 0) baseGrams = 100;

      const perGram = {
        cal: parseFloat(baseServing.calories || "0") / baseGrams,
        p: parseFloat(baseServing.protein || "0") / baseGrams,
        c: parseFloat(baseServing.carbohydrate || "0") / baseGrams,
        f: parseFloat(baseServing.fat || "0") / baseGrams,
        fiber: parseFloat(baseServing.fiber || "0") / baseGrams,
        sugar: parseFloat(baseServing.sugar || "0") / baseGrams,
        sodium: parseFloat(baseServing.sodium || "0") / baseGrams,
        potassium: parseFloat(baseServing.potassium || "0") / baseGrams,
        saturatedFat: parseFloat(baseServing.saturated_fat || "0") / baseGrams,
        polyFat: parseFloat(baseServing.polyunsaturated_fat || "0") / baseGrams,
        monoFat: parseFloat(baseServing.monounsaturated_fat || "0") / baseGrams,
        transFat: parseFloat(baseServing.trans_fat || "0") / baseGrams,
        cholesterol: parseFloat(baseServing.cholesterol || "0") / baseGrams,
        vitaminA: parseFloat(baseServing.vitamin_a || "0") / baseGrams,
        vitaminBComplex: 0,
        vitaminC: parseFloat(baseServing.vitamin_c || "0") / baseGrams,
        vitaminD: parseFloat(baseServing.vitamin_d || "0") / baseGrams,
        vitaminE: 0,
        vitaminK: 0,
        calcium: parseFloat(baseServing.calcium || "0") / baseGrams,
        iron: parseFloat(baseServing.iron || "0") / baseGrams,
        magnesium: parseFloat(baseServing.magnesium || "0") / baseGrams,
        zinc: parseFloat(baseServing.zinc || "0") / baseGrams,
        phosphorus: parseFloat(baseServing.phosphorus || "0") / baseGrams,
        selenium: 0,
        addedSugar: parseFloat(baseServing.added_sugars || "0") / baseGrams,
        leucine: 0,
        bcaas: 0,
        aminoAcidProfile: 0,
      };

      const lowerName = foodName.toLowerCase();
      let portions = [];

      if (
        lowerName.includes("roti") ||
        lowerName.includes("chapati") ||
        lowerName.includes("naan") ||
        lowerName.includes("paratha")
      ) {
        portions.push({
          label: "Roti / Chapati / Paratha",
          value: "roti",
          factor: baseGrams,
        });
      } else if (
        lowerName.includes("slice") ||
        lowerName.includes("bread") ||
        lowerName.includes("pizza") ||
        lowerName.includes("cake") ||
        lowerName.includes("cheese")
      ) {
        portions.push({ label: "Slice", value: "slice", factor: baseGrams });
      } else if (
        lowerName.includes("protein") ||
        lowerName.includes("whey") ||
        lowerName.includes("powder") ||
        lowerName.includes("scoop")
      ) {
        portions.push({ label: "Scoop", value: "scoop", factor: baseGrams });
      } else {
        portions.push({ label: "Piece", value: "piece", factor: baseGrams });
      }

      portions.unshift({
        label: `Serving (${Math.round(baseGrams)}g)`,
        value: "serving",
        factor: baseGrams,
      });

      const optionsGroups = [
        {
          group: "Weight (Accurate)",
          options: [
            { label: "Grams (g)", value: "g", factor: 1 },
            { label: "Kilograms (kg)", value: "kg", factor: 1000 },
            { label: "Ounces (oz)", value: "oz", factor: 28.3495 },
            { label: "Pounds (lb)", value: "lb", factor: 453.592 },
          ],
        },
        {
          group: "Volume & Household",
          options: [
            { label: "Cup", value: "cup", factor: 240 },
            { label: "Tablespoon (tbsp)", value: "tbsp", factor: 15 },
            { label: "Teaspoon (tsp)", value: "tsp", factor: 5 },
            { label: "Glass", value: "glass", factor: 240 },
            { label: "Bowl / Katori", value: "bowl", factor: 150 },
            { label: "Ladle", value: "ladle", factor: 30 },
          ],
        },
        { group: "Count & Portions", options: portions },
      ];

      setSelectedFoodData({
        food_id: foodId,
        food_name: foodName,
        perGram,
        optionsGroups,
      });
      setSelectedUnit("g");
      setQuantity("100");
    } catch (err) {
      console.error("Fetch food details error", err);
      toast.error("Failed to fetch food details");
    } finally {
      setLoading(false);
    }
  }

  // ── Compute live macros for search mode ──────────────────────────────
  function computeSearchMacros() {
    if (!selectedFoodData) return { cal: 0, p: 0, c: 0, f: 0 };
    let factor = 1;
    for (const group of selectedFoodData.optionsGroups) {
      const opt = group.options.find((o) => o.value === selectedUnit);
      if (opt) {
        factor = opt.factor;
        break;
      }
    }
    const q = parseFloat(quantity) || 0;
    const totalMultiplier = q * factor;
    const pg = selectedFoodData.perGram;
    return {
      cal: Math.round(pg.cal * totalMultiplier),
      p: Math.round(pg.p * totalMultiplier),
      c: Math.round(pg.c * totalMultiplier),
      f: Math.round(pg.f * totalMultiplier),
    };
  }

  // ── Save via API search path ─────────────────────────────────────────
  async function handleSaveApiFood() {
    if (!selectedFoodData) return;
    let factor = 1;
    for (const group of selectedFoodData.optionsGroups) {
      const opt = group.options.find((o) => o.value === selectedUnit);
      if (opt) {
        factor = opt.factor;
        break;
      }
    }
    const q = parseFloat(quantity) || 0;
    const totalMultiplier = q * factor;
    const pg = selectedFoodData.perGram;

    const cal = pg.cal * totalMultiplier;
    const p = pg.p * totalMultiplier;
    const c = pg.c * totalMultiplier;
    const f = pg.f * totalMultiplier;

    const nutrients: DetailedNutrients = {
      fiber: pg.fiber * totalMultiplier,
      sugar: pg.sugar * totalMultiplier,
      sodium: pg.sodium * totalMultiplier,
      potassium: pg.potassium * totalMultiplier,
      saturatedFat: pg.saturatedFat * totalMultiplier,
      polyFat: pg.polyFat * totalMultiplier,
      monoFat: pg.monoFat * totalMultiplier,
      transFat: pg.transFat * totalMultiplier,
      cholesterol: pg.cholesterol * totalMultiplier,
      vitaminA: pg.vitaminA * totalMultiplier,
      vitaminBComplex: pg.vitaminBComplex * totalMultiplier,
      vitaminC: pg.vitaminC * totalMultiplier,
      vitaminD: pg.vitaminD * totalMultiplier,
      vitaminE: pg.vitaminE * totalMultiplier,
      vitaminK: pg.vitaminK * totalMultiplier,
      calcium: pg.calcium * totalMultiplier,
      iron: pg.iron * totalMultiplier,
      magnesium: pg.magnesium * totalMultiplier,
      zinc: pg.zinc * totalMultiplier,
      phosphorus: pg.phosphorus * totalMultiplier,
      selenium: pg.selenium * totalMultiplier,
      addedSugar: pg.addedSugar * totalMultiplier,
      leucine: pg.leucine * totalMultiplier,
      bcaas: pg.bcaas * totalMultiplier,
      aminoAcidProfile: pg.aminoAcidProfile * totalMultiplier,
    };

    const meal: Meal = {
      id: uid(),
      name: selectedFoodData.food_name,
      time,
      cal: Math.round(cal),
      p: Math.round(p),
      c: Math.round(c),
      f: Math.round(f),
      nutrients,
      foodId: selectedFoodData.food_id,
    };

    try {
      await addMeal(meal);
      toast.success("Food logged!");
      onClose();
    } catch (err) {
      console.error("Add food error", err);
      toast.error("Failed to log food");
    }
  }

  // ── Save via manual path ─────────────────────────────────────────────
  function handleSaveManual() {
    if (!name.trim()) {
      toast.warning("Please enter a name");
      return;
    }
    let finalCal = parseInt(cal) || 0;
    const finalP = parseInt(p) || 0;
    const finalC = parseInt(c) || 0;
    const finalF = parseInt(f) || 0;
    if (!cal && (finalP > 0 || finalC > 0 || finalF > 0)) {
      finalCal = finalP * 4 + finalC * 4 + finalF * 9;
    }
    const meal: Meal = {
      id: uid(),
      name: name.trim(),
      time,
      cal: finalCal,
      p: finalP,
      c: finalC,
      f: finalF,
    };
    addMeal(meal);
    toast.success("Custom meal logged!");
    onClose();
  }

  // ── Toggle to manual mode ───────────────────────────────────────────
  function switchToManual() {
    setMode("manual");
    setResults([]);
    setSelectedFoodData(null);
    setQuery("");
  }

  // ── Switch back to search mode ──────────────────────────────────────
  function switchToSearch() {
    setMode("search");
    // Clear manual form to avoid stale data mixing with search flow
    setName("");
    setCal("");
    setP("");
    setC("");
    setF("");
  }

  const {
    cal: previewCal,
    p: previewP,
    c: previewC,
    f: previewF,
  } = computeSearchMacros();
  const isManualValid =
    name.trim().length > 0 &&
    (parseInt(cal) > 0 ||
      parseInt(p) > 0 ||
      parseInt(c) > 0 ||
      parseInt(f) > 0);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER — Search mode
  // ══════════════════════════════════════════════════════════════════════
  if (mode === "search") {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-foreground">Log Food</h2>
          <button
            onClick={switchToManual}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            Enter manually
          </button>
        </div>

        {/* Meal time selector */}
        <div className="flex gap-2 mb-4">
          {(["breakfast", "lunch", "dinner", "snack"] as MealTime[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  time === t
                    ? "bg-foreground text-background"
                    : "bg-subtle text-muted-foreground hover:bg-muted dark:hover:bg-foreground"
                }`}>
                {t}
              </button>
            ),
          )}
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food (e.g. apple, tofu, roti)"
            className="w-full bg-subtle border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-foreground dark:focus:border-foreground font-semibold text-[15px]"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* API Results list */}
        {results.length > 0 && !selectedFoodData && (
          <div className="mb-3 divide-y divide-border dark:divide-foreground border border-border rounded-xl overflow-hidden bg-foreground dark:bg-foreground">
            {results.map((food) => (
              <div
                key={food.food_id}
                className="p-3 hover:bg-subtle transition-colors flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground text-sm">
                    {food.food_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {food.food_description}
                  </div>
                </div>
                <button
                  onClick={() => handleSelectFood(food.food_id, food.food_name)}
                  disabled={loading}
                  className="w-8 h-8 flex items-center justify-center bg-subtle hover:bg-muted dark:bg-foreground dark:hover:bg-muted rounded-full text-foreground shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Serving picker + live macro preview */}
        {selectedFoodData && (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={() => setSelectedFoodData(null)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              ← Back to results
            </button>

            {/* Food name + time */}
            <div>
              <h3 className="font-bold text-foreground">
                {selectedFoodData.food_name}
              </h3>
              <div className="text-xs text-muted-foreground capitalize font-semibold">
                {time}
              </div>
            </div>

            {/* Quantity + unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:border-foreground dark:focus:border-foreground font-semibold text-[14px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Serving Size
                </label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:ring-0 focus:border-foreground dark:focus:border-foreground font-semibold text-[14px] h-auto">
                    <SelectValue placeholder="Select serving size" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFoodData.optionsGroups.map((group, gIdx) => (
                      <SelectGroup key={gIdx}>
                        <SelectLabel className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider px-2 py-1.5 bg-background">
                          {group.group}
                        </SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live macro preview */}
            <div className="flex justify-between items-center bg-subtle rounded-xl border border-border p-4">
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Calories
                </div>
                <div className="font-bold text-foreground">{previewCal}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Protein
                </div>
                <div className="font-bold text-foreground">{previewP}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Carbs
                </div>
                <div className="font-bold text-foreground">{previewC}g</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Fat
                </div>
                <div className="font-bold text-foreground">{previewF}g</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSaveApiFood}
                disabled={parseFloat(quantity) <= 0}
                className="px-6 py-2.5 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm">
                Add to Log
              </button>{" "}
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-background transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state — no query yet */}
        {query.length === 0 && !selectedFoodData && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Start typing to search for a food, or{" "}
            <button
              onClick={switchToManual}
              className="underline underline-offset-2 font-semibold text-foreground">
              enter manually
            </button>
            .
          </p>
        )}

        {/* No results */}
        {query.length >= 3 &&
          results.length === 0 &&
          !loading &&
          !selectedFoodData && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results for "{query}".{" "}
              <button
                onClick={switchToManual}
                className="underline underline-offset-2 font-semibold text-foreground">
                Enter manually
              </button>
              .
            </p>
          )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER — Manual mode
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-foreground">Manual Food Entry</h2>
        <button
          onClick={switchToSearch}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
          Search foods
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Food Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homemade Greek Salad"
              className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:border-foreground dark:focus:border-foreground font-semibold text-[14px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Category
            </label>
            <div className="flex gap-2">
              {(["breakfast", "lunch", "dinner", "snack"] as MealTime[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`flex-1 py-2.5 rounded-xl  text-sm font-bold capitalize transition-colors border ${
                      time === t
                        ? "bg-foreground text-background border-foreground dark:border-foreground"
                        : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
                    }`}>
                    {t}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-subtle border border-border rounded-xl">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Calories
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={cal}
                onChange={(e) => setCal(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-8 outline-none focus:border-foreground dark:focus:border-foreground font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                kcal
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Protein
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-foreground dark:focus:border-foreground font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                g
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Carbs
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={c}
                onChange={(e) => setC(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-foreground dark:focus:border-foreground font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                g
              </span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Fat
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={f}
                onChange={(e) => setF(e.target.value)}
                placeholder="0"
                className="w-full bg-card border border-border rounded-lg py-2 pl-3 pr-6 outline-none focus:border-foreground dark:focus:border-foreground font-mono text-[15px]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                g
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            onClick={handleSaveManual}
            disabled={!isManualValid}
            className="w-full sm:w-auto px-6 py-2.5 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm">
            Save Meal
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-background transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
