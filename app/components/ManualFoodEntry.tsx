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

import type { USDAFood } from "@/app/lib/usda";

function n(value: number | undefined): number {
  return typeof value === "number" && isFinite(value) ? value : 0;
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
  const [results, setResults] = useState<USDAFood[]>([]);
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
  function handleSelectFood(food: USDAFood) {
    const getNutrient = (num: string) => {
      const n = food.foodNutrients.find(x => x.nutrientNumber === num);
      return n ? n.value : 0;
    };

    /* USDA returns per 100g by default. */
    const per100g = {
      cal: getNutrient("208"),
      p: getNutrient("203"),
      c: getNutrient("205"),
      f: getNutrient("204"),
      fiber: getNutrient("291"),
      sugar: getNutrient("269"),
      sodium: getNutrient("307"),
      potassium: getNutrient("306"),
      calcium: getNutrient("301"),
      iron: getNutrient("303"),
      saturatedFat: getNutrient("606"),
      polyFat: getNutrient("646"),
      monoFat: getNutrient("645"),
      transFat: getNutrient("605"),
      cholesterol: getNutrient("601"),
      vitaminA: getNutrient("318"),
      vitaminBComplex: 0,
      vitaminC: getNutrient("401"),
      vitaminD: getNutrient("328"),
      vitaminE: getNutrient("323"),
      vitaminK: getNutrient("430"),
      magnesium: getNutrient("304"),
      zinc: getNutrient("309"),
      phosphorus: getNutrient("305"),
      selenium: getNutrient("317"),
      addedSugar: getNutrient("539"),
      leucine: 0,
      bcaas: 0,
      aminoAcidProfile: 0,
    };
    
    const perGram = Object.fromEntries(
      Object.entries(per100g).map(([k, v]) => [k, v / 100]),
    ) as Record<string, number>;

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
    
    let optionsGroups = [];
    
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

    setSelectedFoodData({
      food_id: food.fdcId.toString(),
      food_name: labelStr,
      perGram,
      optionsGroups,
    });
    setSelectedUnit("g");
    setQuantity("100");
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
          <div className="mb-3 divide-y divide-border border border-border rounded-xl overflow-hidden">
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
                  className="w-8 h-8 flex items-center justify-center bg-subtle hover:bg-muted rounded-full text-foreground shrink-0 border border-border">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )})}
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
