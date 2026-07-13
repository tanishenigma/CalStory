import re

with open("app/components/InlineFoodSearch.tsx", "r") as f:
    inline_content = f.read()

inline_content = inline_content.replace('import type { EdamamHint } from "@/app/lib/edamam";', 'import type { USDAFood } from "@/app/lib/usda";')
inline_content = inline_content.replace('const [results, setResults] = useState<EdamamHint[]>([]);', 'const [results, setResults] = useState<USDAFood[]>([]);')
inline_content = inline_content.replace('const foods: EdamamHint[] = data?.foods?.food ?? [];', 'const foods: USDAFood[] = data?.foods?.food ?? [];')

select_food_pattern = re.compile(r'function handleSelectFood\(hint: EdamamHint\) \{.*?// ── Compute live macros for search mode', re.DOTALL)
new_select_food = """function handleSelectFood(food: USDAFood) {
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
    ) as SelectedFood["perGram"];

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
    
    let optionsGroups: SelectedFood["optionsGroups"] = [];
    
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

  // ── Compute live macros for search mode"""

inline_content = select_food_pattern.sub(new_select_food, inline_content)

search_render_pattern = re.compile(r'\{\/\* Results \*\/.*?\{\/\* Empty state after search \*\/\}', re.DOTALL)
new_search_render = """{/* Results */}
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

      {/* Empty state after search */}"""
inline_content = search_render_pattern.sub(new_search_render, inline_content)
with open("app/components/InlineFoodSearch.tsx", "w") as f:
    f.write(inline_content)


with open("app/components/ManualFoodEntry.tsx", "r") as f:
    manual_content = f.read()

manual_content = manual_content.replace('import type { EdamamHint } from "@/app/lib/edamam";', 'import type { USDAFood } from "@/app/lib/usda";')
manual_content = manual_content.replace('const [results, setResults] = useState<EdamamHint[]>([]);', 'const [results, setResults] = useState<USDAFood[]>([]);')
manual_content = manual_content.replace('const foods: EdamamHint[] = data?.foods?.food ?? [];', 'const foods: USDAFood[] = data?.foods?.food ?? [];')

select_food_pattern_manual = re.compile(r'function handleSelectFood\(hint: EdamamHint\) \{.*?// ── Compute live macros for search mode', re.DOTALL)
new_select_food_manual = """function handleSelectFood(food: USDAFood) {
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

  // ── Compute live macros for search mode"""

manual_content = select_food_pattern_manual.sub(new_select_food_manual, manual_content)

manual_search_render_pattern = re.compile(r'\{\/\* API Results list \*\/.*?\{\/\* Serving picker \+ live macro preview \*\/\}', re.DOTALL)
new_manual_search_render = """{/* API Results list */}
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

        {/* Serving picker + live macro preview */}"""

manual_content = manual_search_render_pattern.sub(new_manual_search_render, manual_content)
with open("app/components/ManualFoodEntry.tsx", "w") as f:
    f.write(manual_content)
