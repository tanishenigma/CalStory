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

interface FatSecretFood {
  food_id: string;
  food_name: string;
  food_description: string;
}

export default function InlineFoodSearch({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { addMeal } = useApp();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FatSecretFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<MealTime>("lunch");

  const [selectedFoodData, setSelectedFoodData] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState("g");
  const [quantity, setQuantity] = useState("100");

  useEffect(() => {
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
  }, [query]);

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
        vitaminBComplex: 0, // Not provided by FatSecret Basic
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

  async function handleSaveFood() {
    if (!selectedFoodData) return;

    let factor = 1;
    for (const group of selectedFoodData.optionsGroups) {
      const opt = group.options.find((o: any) => o.value === selectedUnit);
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
      time: selectedTime,
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
      setQuery("");
      setResults([]);
      setSelectedFoodData(null);
      if (onClose) onClose();
    } catch (err) {
      console.error("Add food error", err);
      toast.error("Failed to log food");
    }
  }

  if (selectedFoodData) {
    let factor = 1;
    for (const group of selectedFoodData.optionsGroups) {
      const opt = group.options.find((o: any) => o.value === selectedUnit);
      if (opt) {
        factor = opt.factor;
        break;
      }
    }

    const q = parseFloat(quantity) || 0;
    const totalMultiplier = q * factor;
    const pg = selectedFoodData.perGram;

    const cal = Math.round(pg.cal * totalMultiplier);
    const p = Math.round(pg.p * totalMultiplier);
    const c = Math.round(pg.c * totalMultiplier);
    const f = Math.round(pg.f * totalMultiplier);

    return (
      <div className="bg-background text-foreground dark:bg-[#1a1916] rounded-2xl shadow-sm border border-border p-5 mb-8">
        <h2 className="text-lg font-bold text-[#1A1916] dark:text-[#f7f6f3] mb-1">
          {selectedFoodData.food_name}
        </h2>
        <div className="text-xs text-[#9B9895] mb-6 capitalize font-semibold">
          {selectedTime}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#9B9895] block mb-1.5">
              Serving Size
            </label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-full bg-subtle border border-border rounded-xl py-2.5 px-3 outline-none focus:ring-0 focus:border-border font-semibold text-[14px] h-auto">
                <SelectValue placeholder="Select serving size" />
              </SelectTrigger>
              <SelectContent>
                {selectedFoodData.optionsGroups.map(
                  (group: any, gIdx: number) => (
                    <SelectGroup key={gIdx}>
                      <SelectLabel className="text-[10px] uppercase text-[#9B9895] font-bold tracking-wider px-2 py-1.5 bg-background">
                        {group.group}
                      </SelectLabel>
                      {group.options.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center bg-subtle rounded-xl border border-border p-4 mb-6">
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Calories
            </div>
            <div className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {cal}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Protein
            </div>
            <div className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {p}g
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Carbs
            </div>
            <div className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {c}g
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-[#9B9895] uppercase tracking-wider mb-1">
              Fat
            </div>
            <div className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
              {f}g
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setSelectedFoodData(null)}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#9B9895] hover:bg-background transition-colors">
            Back
          </button>
          <button
            onClick={handleSaveFood}
            disabled={q <= 0}
            className="px-6 py-2.5 bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm">
            Add to Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background dark:bg-[#1a1916] rounded-2xl shadow-sm border border-border p-4 mb-8">
      <h2 className="text-lg font-bold text-[#1A1916] dark:text-[#f7f6f3] mb-4">
        Log Food via Database
      </h2>

      <div className="flex gap-2 mb-4">
        {["breakfast", "lunch", "dinner", "snack"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTime(t as MealTime)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              selectedTime === t
                ? "bg-[#1A1916] dark:bg-[#f7f6f3] text-white dark:text-[#1a1916]"
                : "bg-background text-[#9B9895] hover:bg-[#E8E7E4]"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9895]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food (e.g. apple, tofu)"
          className="w-full bg-subtle border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-border font-semibold text-[15px]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9895] animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 divide-y divide-[#E8E7E4] border border-border rounded-xl overflow-hidden bg-foreground dark:bg-[#1a1916]">
          {results.map((food) => (
            <div
              key={food.food_id}
              className="p-3 hover:bg-subtle transition-colors flex items-center justify-between">
              <div>
                <div className="font-bold text-[#1A1916] dark:text-[#f7f6f3] text-sm">
                  {food.food_name}
                </div>
                <div className="text-xs text-[#9B9895]">
                  {food.food_description}
                </div>
              </div>
              <button
                onClick={() => handleSelectFood(food.food_id, food.food_name)}
                disabled={loading}
                className="w-8 h-8 flex items-center justify-center bg-background hover:bg-[#E8E7E4] rounded-full text-[#1A1916] dark:text-[#f7f6f3]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
