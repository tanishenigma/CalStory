"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus, Utensils } from "lucide-react";
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
import type { Meal, DetailedNutrients, MealTime } from "@/app/types";
import type { USDAFood } from "@/app/lib/usda";

/* ------------------------------------------------------------------
 * InlineFoodSearch
 * Powered by Open Food Facts (Free, No API Keys)
 *
 * Flow:
 *   1. User types → debounced search via /api/food/search?q=
 *   2. User picks a food → nutrient data is already in the result
 *   3. User sets quantity + unit → macros are computed client-side
 *   4. User taps "Add to Log" → addMeal()
 * ------------------------------------------------------------------ */

/** Helper: safely parse a number. */
function n(value: number | undefined): number {
  return typeof value === "number" && isFinite(value) ? value : 0;
}

interface SelectedFood {
  foodId: string;
  label: string;
  /** Per-gram nutrient values, derived from OFF's per-100g data. */
  perGram: {
    cal: number;
    p: number;
    c: number;
    f: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  /** Flat list of serving options for the Select control. */
  optionsGroups: {
    group: string;
    options: { label: string; value: string; factor: number }[];
  }[];
}

export default function InlineFoodSearch({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { addMeal } = useApp();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<USDAFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<MealTime>("lunch");

  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [quantity, setQuantity] = useState("100");

  /* -------------------------------------------------------------- */
  /* Search (debounced 400ms)                                        */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/food/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const foods: USDAFood[] = data?.foods?.food ?? [];
        setResults(foods);
      } catch {
        toast.error("Food search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  /* -------------------------------------------------------------- */
  /* Select food from results                                        */
  /* -------------------------------------------------------------- */
  function handleSelectFood(food: USDAFood) {
    const getNutrient = (num: string) => {
      const n = food.foodNutrients?.find(x => x.nutrientNumber === num);
      return n ? n.value : 0;
    };

    /* USDA nutrients are per 100g. */
    const per100g = {
      cal: getNutrient("208"),
      p: getNutrient("203"),
      c: getNutrient("205"),
      f: getNutrient("204"),
      fiber: getNutrient("291"),
      sugar: getNutrient("269"),
      sodium: getNutrient("307"),
    };

    /* Convert to per-gram. */
    const perGram = Object.fromEntries(
      Object.entries(per100g).map(([k, v]) => [k, v / 100]),
    ) as SelectedFood["perGram"];

    /* Determine a context-sensitive "piece/portion" label. */
    const labelStr = food.description || "Food";
    const lowerName = labelStr.toLowerCase();
    let portionLabel = "Piece";
    if (lowerName.includes("roti") || lowerName.includes("chapati") || lowerName.includes("naan") || lowerName.includes("paratha")) {
      portionLabel = "Roti / Chapati";
    } else if (lowerName.includes("slice") || lowerName.includes("bread") || lowerName.includes("pizza") || lowerName.includes("cake")) {
      portionLabel = "Slice";
    } else if (lowerName.includes("scoop") || lowerName.includes("protein") || lowerName.includes("whey")) {
      portionLabel = "Scoop";
    } else if (lowerName.includes("egg")) {
      portionLabel = "Egg";
    }

    const optionsGroups: SelectedFood["optionsGroups"] = [];

    if (food.servingSize && food.servingSizeUnit) {
      optionsGroups.push({
        group: "Standard Measures",
        options: [
          {
            label: food.householdServingFullText ? food.householdServingFullText : `1 Serving (${food.servingSize}${food.servingSizeUnit})`,
            value: "serving",
            factor: food.servingSizeUnit.toLowerCase() === "g" || food.servingSizeUnit.toLowerCase() === "ml" ? food.servingSize : 100
          }
        ]
      });
    }

    optionsGroups.push(
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
      {
        group: "Count & Portions",
        options: [
          { label: portionLabel, value: "portion", factor: 80 },
        ],
      }
    );

    setSelectedFood({
      foodId: food.fdcId.toString(),
      label: labelStr,
      perGram,
      optionsGroups,
    });
    setSelectedUnit("g");
    setQuantity("100");
  }

  /* -------------------------------------------------------------- */
  /* Compute current macros for the selected quantity + unit        */
  /* -------------------------------------------------------------- */
  function getEffectiveFactor(): number {
    if (!selectedFood) return 1;
    for (const group of selectedFood.optionsGroups) {
      const opt = group.options.find((o) => o.value === selectedUnit);
      if (opt) return opt.factor;
    }
    return 1;
  }

  /* -------------------------------------------------------------- */
  /* Save food to log                                               */
  /* -------------------------------------------------------------- */
  async function handleSaveFood() {
    if (!selectedFood) return;

    const factor = getEffectiveFactor();
    const q = parseFloat(quantity) || 0;
    if (q <= 0) {
      toast.warning("Please enter a valid quantity.");
      return;
    }
    const totalGrams = q * factor;
    const pg = selectedFood.perGram;

    const nutrients: DetailedNutrients = {
      fiber: pg.fiber * totalGrams,
      sugar: pg.sugar * totalGrams,
      sodium: pg.sodium * totalGrams,
      potassium: 0,
      saturatedFat: 0,
      polyFat: 0,
      monoFat: 0,
      transFat: 0,
      cholesterol: 0,
      vitaminA: 0,
      vitaminBComplex: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminE: 0,
      vitaminK: 0,
      calcium: 0,
      iron: 0,
      magnesium: 0,
      zinc: 0,
      phosphorus: 0,
      selenium: 0,
      addedSugar: 0,
      leucine: 0,
      bcaas: 0,
      aminoAcidProfile: 0,
    };

    const meal: Meal = {
      id: uid(),
      name: selectedFood.label,
      time: selectedTime,
      cal: Math.round(pg.cal * totalGrams),
      p: Math.round(pg.p * totalGrams),
      c: Math.round(pg.c * totalGrams),
      f: Math.round(pg.f * totalGrams),
      nutrients,
      foodId: selectedFood.foodId,
    };

    try {
      await addMeal(meal);
      toast.success("Food logged!");
      setQuery("");
      setResults([]);
      setSelectedFood(null);
      onClose?.();
    } catch {
      toast.error("Failed to log food");
    }
  }

  /* -------------------------------------------------------------- */
  /* Render — detail view                                           */
  /* -------------------------------------------------------------- */
  if (selectedFood) {
    const factor = getEffectiveFactor();
    const q = parseFloat(quantity) || 0;
    const totalGrams = q * factor;
    const pg = selectedFood.perGram;

    const cal = Math.round(pg.cal * totalGrams);
    const p = Math.round(pg.p * totalGrams);
    const c = Math.round(pg.c * totalGrams);
    const f = Math.round(pg.f * totalGrams);

    return (
      <div className="bg-background rounded-2xl shadow-sm border border-border p-5 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-1">
          {selectedFood.label}
        </h2>
        <div className="text-xs text-muted-foreground mb-6 capitalize font-semibold">
          {selectedTime}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Amount
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:border-border font-semibold text-[14px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Serving Size
            </label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:ring-0 focus:border-border font-semibold text-[14px] h-auto">
                <SelectValue placeholder="Select serving size" />
              </SelectTrigger>
              <SelectContent>
                {selectedFood.optionsGroups.map((group, gIdx) => (
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

        <div className="flex justify-between items-center bg-subtle rounded-xl border border-border p-4 mb-6">
          {[
            { label: "Calories", value: `${cal}` },
            { label: "Protein", value: `${p}g` },
            { label: "Carbs", value: `${c}g` },
            { label: "Fat", value: `${f}g` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className="font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setSelectedFood(null)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:bg-subtle transition-colors">
            Back
          </button>
          <button
            onClick={handleSaveFood}
            disabled={q <= 0}
            className="px-6 py-2.5 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm">
            Add to Log
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /* Render — search view                                           */
  /* -------------------------------------------------------------- */
  return (
    <div className="bg-background rounded-2xl shadow-sm border border-border p-4 mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4">
        Log Food via Database
      </h2>

      {/* Meal time selector */}
      <div className="flex gap-2 mb-4">
        {(["breakfast", "lunch", "dinner", "snack"] as MealTime[]).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTime(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              selectedTime === t
                ? "bg-foreground text-background"
                : "bg-subtle text-muted-foreground hover:bg-muted"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food (e.g. apple, yogurt)"
          className="w-full bg-subtle border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-border font-semibold text-[15px]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
          {results.map((food, idx) => {
            const getNutrient = (num: string) => {
              const n = food.foodNutrients.find(x => x.nutrientNumber === num);
              return n ? n.value : 0;
            };
            const cal = Math.round(getNutrient("208"));
            const p = Math.round(getNutrient("203"));
            const c = Math.round(getNutrient("205"));
            const f = Math.round(getNutrient("204"));
            const brandInfo = food.brandOwner ? ` · ${food.brandOwner}` : "";
            const description = `${cal} kcal · P${p}g C${c}g F${f}g per 100g${brandInfo}`;
            
            return (
              <div
                key={`${food.fdcId}-${idx}`}
                className="p-3 hover:bg-subtle transition-colors flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-foreground text-sm truncate">
                    {food.description || "Unknown Food"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {description}
                  </div>
                </div>
                <button
                  onClick={() => handleSelectFood(food)}
                  disabled={loading}
                  className="w-8 h-8 shrink-0 flex items-center justify-center bg-subtle hover:bg-muted rounded-full text-foreground border border-border transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <Utensils className="w-8 h-8 opacity-40" />
          <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
