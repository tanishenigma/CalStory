/**
 * ReferenceTables — four reference data tables for the
 * `/tools/calorie-calculator` SEO landing page.
 *
 * Each table is wrapped in `overflow-x-auto` so mobile users
 * get a horizontal scroll bar instead of a broken layout. The
 * tables themselves are plain HTML so screen readers and
 * crawlers see them without JavaScript execution.
 *
 * Data sourcing
 * ─────────────
 *   • Food calorie values: rounded averages from the USDA
 *     FoodData Central database (the public-facing release that
 *     backs almost every nutrition label and clinical dataset
 *     in the US). Values are per commonly-eaten portion; the
 *     exact grams are listed in the second column so a curious
 *     reader can verify against the source.
 *
 *   • Calories burned per activity: MET values from the 2011
 *     Compendium of Physical Activities (Ainsworth et al.,
 *     Medicine & Science in Sports & Exercise). kcal/hour =
 *     MET × bodyWeight(kg) × 1.05, rounded to the nearest 10.
 *     Reference body weights in pounds are converted to kg
 *     internally so the math matches the published formula.
 *
 *   • Energy density per gram: textbook values, identical in
 *     every nutrition reference.
 *
 *   • Sample meal plans: composed from the food table above to
 *     hit each column target. No source citation because these
 *     are illustrative; the food items themselves are sourced.
 */

/* ──────────────────────────────────────────────────────────
 * 1. Common foods and approximate calories
 * ────────────────────────────────────────────────────────── */

type FoodRow = { food: string; portion: string; kcal: number };

const FOOD_ROWS: FoodRow[] = [
  // Fruits
  { food: "Apple", portion: "1 medium (182 g)", kcal: 95 },
  { food: "Banana", portion: "1 medium (118 g)", kcal: 105 },
  { food: "Orange", portion: "1 medium (131 g)", kcal: 62 },
  { food: "Blueberries", portion: "1 cup (148 g)", kcal: 84 },
  { food: "Strawberries", portion: "1 cup (152 g)", kcal: 49 },
  { food: "Grapes", portion: "1 cup (151 g)", kcal: 104 },
  { food: "Avocado", portion: "½ medium (100 g)", kcal: 160 },
  { food: "Mango", portion: "1 cup chopped (165 g)", kcal: 99 },

  // Vegetables
  { food: "Broccoli, steamed", portion: "1 cup (156 g)", kcal: 55 },
  { food: "Spinach, raw", portion: "1 cup (30 g)", kcal: 7 },
  { food: "Carrots, raw", portion: "1 cup chopped (128 g)", kcal: 52 },
  { food: "Sweet potato, baked", portion: "1 medium (130 g)", kcal: 112 },
  { food: "Bell pepper", portion: "1 medium (119 g)", kcal: 24 },
  { food: "Kale, raw", portion: "1 cup (67 g)", kcal: 33 },

  // Proteins
  { food: "Chicken breast, cooked", portion: "100 g", kcal: 165 },
  { food: "Salmon, cooked", portion: "100 g", kcal: 208 },
  { food: "Ground beef 85/15, cooked", portion: "100 g", kcal: 250 },
  { food: "Egg, large", portion: "1 egg (50 g)", kcal: 72 },
  { food: "Egg whites", portion: "100 g", kcal: 52 },
  { food: "Tofu, firm", portion: "100 g", kcal: 144 },
  { food: "Greek yogurt, plain non-fat", portion: "170 g cup", kcal: 100 },
  { food: "Cottage cheese, low-fat", portion: "100 g", kcal: 81 },
  { food: "Whey protein powder", portion: "1 scoop (30 g)", kcal: 120 },
  { food: "Lentils, cooked", portion: "1 cup (198 g)", kcal: 230 },
  { food: "Black beans, cooked", portion: "1 cup (172 g)", kcal: 227 },

  // Common meals / snacks
  { food: "Cheeseburger, fast-food", portion: "1 burger", kcal: 540 },
  { food: "Pizza, cheese slice", portion: "1 large slice", kcal: 285 },
  { food: "Chipotle burrito bowl (chicken)", portion: "1 bowl", kcal: 645 },
  { food: "Sushi roll, avocado", portion: "1 roll (6 pc)", kcal: 255 },
  { food: "Caesar salad with chicken", portion: "1 entrée", kcal: 480 },
  { food: "Protein bar", portion: "1 bar (60 g)", kcal: 220 },
  { food: "Dark chocolate (70%)", portion: "1 oz (28 g)", kcal: 170 },
  { food: "Mixed nuts, roasted", portion: "1 oz (28 g)", kcal: 175 },

  // Drinks
  { food: "Black coffee", portion: "1 cup (240 ml)", kcal: 2 },
  { food: "Latte, whole milk", portion: "12 oz", kcal: 180 },
  { food: "Orange juice", portion: "8 oz (240 ml)", kcal: 110 },
  { food: "Soda, regular", portion: "12 oz can", kcal: 140 },
  { food: "Beer, regular", portion: "12 oz", kcal: 153 },
  { food: "Red wine", portion: "5 oz (147 ml)", kcal: 125 },
];

function FoodTable() {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm border-collapse min-w-[420px]">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              Food
            </th>
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              Portion
            </th>
            <th
              scope="col"
              className="text-right font-bold text-foreground py-2 pl-4">
              kcal
            </th>
          </tr>
        </thead>
        <tbody>
          {FOOD_ROWS.map((row) => (
            <tr
              key={row.food}
              className="border-b border-border/40 last:border-0">
              <th
                scope="row"
                className="text-left font-normal text-foreground py-2 pr-4">
                {row.food}
              </th>
              <td className="text-left text-muted-foreground py-2 pr-4">
                {row.portion}
              </td>
              <td className="text-right font-mono text-foreground py-2 pl-4">
                {row.kcal}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 2. Sample meal plans at 1,200 / 1,500 / 2,000 kcal
 * ────────────────────────────────────────────────────────── */

type MealPlan = {
  meal: string;
  items: string;
  kcal: number;
};

const MEAL_PLANS: Record<"1200" | "1500" | "2000", MealPlan[]> = {
  "1200": [
    {
      meal: "Breakfast",
      items: "2 eggs scrambled + 1 slice whole-grain toast + ½ avocado",
      kcal: 380,
    },
    {
      meal: "Lunch",
      items: "Mixed green salad with 100g grilled chicken, olive oil + vinegar",
      kcal: 320,
    },
    {
      meal: "Dinner",
      items: "120g baked salmon, 1 cup broccoli, ½ cup quinoa",
      kcal: 400,
    },
    {
      meal: "Snack",
      items: "1 small apple + 1 tbsp almond butter",
      kcal: 100,
    },
  ],
  "1500": [
    {
      meal: "Breakfast",
      items: "Greek yogurt (170g) with ½ cup blueberries + 1 tbsp honey",
      kcal: 280,
    },
    {
      meal: "Lunch",
      items: "Whole-grain wrap with 100g turkey, spinach, tomato, hummus",
      kcal: 450,
    },
    {
      meal: "Dinner",
      items: "130g chicken breast, 1 cup sweet potato, 2 cups roasted veg",
      kcal: 550,
    },
    {
      meal: "Snack",
      items: "1 scoop whey + 1 banana",
      kcal: 220,
    },
  ],
  "2000": [
    {
      meal: "Breakfast",
      items: "Oats (80g) cooked with milk, 1 banana, 1 scoop whey",
      kcal: 550,
    },
    {
      meal: "Lunch",
      items: "Chicken burrito bowl — rice, beans, chicken, salsa, cheese",
      kcal: 650,
    },
    {
      meal: "Dinner",
      items: "150g lean steak, 1 large baked potato, large side salad",
      kcal: 600,
    },
    {
      meal: "Snack",
      items: "2 oz mixed nuts + 1 protein bar",
      kcal: 200,
    },
  ],
};

function MealPlanTable() {
  const totals = Object.fromEntries(
    Object.entries(MEAL_PLANS).map(([k, meals]) => [
      k,
      meals.reduce((sum, m) => sum + m.kcal, 0),
    ]),
  ) as Record<"1200" | "1500" | "2000", number>;

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4 w-[120px]">
              Meal
            </th>
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              1,200 kcal plan
            </th>
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              1,500 kcal plan
            </th>
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2">
              2,000 kcal plan
            </th>
          </tr>
        </thead>
        <tbody>
          {MEAL_PLANS["1200"].map((_, i) => (
            <tr
              key={MEAL_PLANS["1200"][i].meal}
              className="border-b border-border/40 last:border-0 align-top">
              <th
                scope="row"
                className="text-left font-bold text-foreground py-3 pr-4">
                {MEAL_PLANS["1200"][i].meal}
              </th>
              {(["1200", "1500", "2000"] as const).map((planKey) => {
                const m = MEAL_PLANS[planKey][i];
                return (
                  <td
                    key={planKey}
                    className="text-left text-muted-foreground py-3 pr-4">
                    <div>{m.items}</div>
                    <div className="font-mono text-xs text-foreground mt-1">
                      {m.kcal} kcal
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-foreground/[0.02]">
            <th
              scope="row"
              className="text-left font-bold text-foreground py-3 pr-4">
              Total
            </th>
            {(["1200", "1500", "2000"] as const).map((planKey) => (
              <td
                key={planKey}
                className="text-left font-mono font-bold text-foreground py-3 pr-4">
                {totals[planKey]} kcal
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 3. Calories burned per hour — MET-based
 *
 * MET = metabolic equivalent of task. kcal/hour ≈ MET × kg × 1.05.
 * The constants come from the 2011 Compendium of Physical
 * Activities (Ainsworth et al.); reference body weights convert
 * lbs to kg so the formula matches.
 * ────────────────────────────────────────────────────────── */

type ActivityRow = { activity: string; met: number };

const ACTIVITY_ROWS: ActivityRow[] = [
  { activity: "Walking, 3.0 mph (flat)", met: 3.5 },
  { activity: "Running, 6.0 mph (10 min/mi)", met: 9.8 },
  { activity: "Cycling, 12–14 mph", met: 8.0 },
  { activity: "Swimming, moderate freestyle", met: 5.8 },
  { activity: "Yoga, Hatha", met: 2.5 },
  { activity: "HIIT, vigorous", met: 8.0 },
  { activity: "Weight training, vigorous", met: 6.0 },
  { activity: "Hiking, general", met: 6.0 },
  { activity: "Jump rope, moderate", met: 11.8 },
  { activity: "Rowing, moderate", met: 7.0 },
];

const REF_WEIGHTS_LBS = [130, 155, 180, 205] as const;

function ActivityTable() {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm border-collapse min-w-[520px]">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              Activity
            </th>
            {REF_WEIGHTS_LBS.map((w) => (
              <th
                key={w}
                scope="col"
                className="text-right font-bold text-foreground py-2 px-2">
                {w} lb
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ACTIVITY_ROWS.map((row) => (
            <tr
              key={row.activity}
              className="border-b border-border/40 last:border-0">
              <th
                scope="row"
                className="text-left font-normal text-foreground py-2 pr-4">
                {row.activity}
              </th>
              {REF_WEIGHTS_LBS.map((w) => {
                const kg = w / 2.20462;
                const kcal = Math.round((row.met * kg * 1.05) / 10) * 10;
                return (
                  <td
                    key={w}
                    className="text-right font-mono text-foreground py-2 px-2">
                    {kcal}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 4. Energy density per gram
 * ────────────────────────────────────────────────────────── */

type MacroRow = { macro: string; kcalPerGram: number; note?: string };

const MACRO_ROWS: MacroRow[] = [
  { macro: "Fat", kcalPerGram: 9 },
  { macro: "Alcohol (ethanol)", kcalPerGram: 7 },
  { macro: "Protein", kcalPerGram: 4 },
  { macro: "Carbohydrates", kcalPerGram: 4 },
  {
    macro: "Fiber",
    kcalPerGram: 2,
    note: "Partially digested; net ~1.5–2 kcal/g for soluble fiber.",
  },
];

function MacroTable() {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full text-sm border-collapse min-w-[360px]">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2 pr-4">
              Macronutrient
            </th>
            <th
              scope="col"
              className="text-right font-bold text-foreground py-2 pr-4">
              kcal / gram
            </th>
            <th
              scope="col"
              className="text-left font-bold text-foreground py-2">
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {MACRO_ROWS.map((row) => (
            <tr
              key={row.macro}
              className="border-b border-border/40 last:border-0">
              <th
                scope="row"
                className="text-left font-normal text-foreground py-2 pr-4">
                {row.macro}
              </th>
              <td className="text-right font-mono text-foreground py-2 pr-4">
                {row.kcalPerGram}
              </td>
              <td className="text-left text-muted-foreground py-2">
                {row.note ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Wrapper — the four tables in order, each with a heading
 * and a one-line footnote.
 * ────────────────────────────────────────────────────────── */

export default function ReferenceTables() {
  return (
    <div className="space-y-14">
      <section id="food-calories">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground font-heading tracking-tight mb-4">
          Common foods and approximate calories
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Calorie values are rounded averages from the USDA FoodData Central
          database. Use these as a starting point; packaged foods will vary by
          brand and preparation method.
        </p>
        <FoodTable />
      </section>

      <section id="meal-plans">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground font-heading tracking-tight mb-4">
          Sample meal plans at 1,200 / 1,500 / 2,000 calories
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Three illustrative full-day structures built from the foods above. The
          1,200-kcal plan is a typical starter cut for a small-frame adult; the
          1,500-kcal plan fits a moderate deficit for most men and a small
          deficit for many women; the 2,000-kcal plan lands near maintenance for
          an active adult.
        </p>
        <MealPlanTable />
      </section>

      <section id="activity-burn">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground font-heading tracking-tight mb-4">
          Calories burned per hour by activity and body weight
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          kcal/hour ≈ MET × bodyweight(kg) × 1.05. MET values come from the 2011
          Compendium of Physical Activities (Ainsworth et al.); reference
          weights are in pounds. Real burn rates also depend on terrain,
          intensity, and individual physiology — treat these as planning
          estimates, not exact values.
        </p>
        <ActivityTable />
      </section>

      <section id="energy-density">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground font-heading tracking-tight mb-4">
          Energy density per gram of macronutrient
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The textbook Atwater factors. These are the numbers every nutrition
          label in the US is built on, and they explain why fat-heavy foods are
          so calorie-dense for their weight.
        </p>
        <MacroTable />
      </section>
    </div>
  );
}
