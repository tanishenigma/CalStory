/**
 * FAQ data for `/tools/calorie-calculator`.
 *
 * Server-only module (no `"use client"`) so the JSON-LD payload
 * can be built at SSR time without crossing the client boundary.
 * Pattern mirrors `app/about/faqData.ts`.
 *
 * `short` is the plain-text answer that Google harvests for the
 * rich-result snippet; the longer JSX answers live in
 * `page.tsx` (rendered as a server-rendered <details> list at the
 * bottom of the page).
 */

export type ToolFaq = {
  q: string;
  short: string;
};

export const TOOL_FAQS: ReadonlyArray<ToolFaq> = [
  {
    q: "How many calories should I eat a day?",
    short:
      "How many calories you should eat depends on your age, sex, height, weight, and activity level. For most moderately-active adults, daily maintenance falls between 1,800 and 2,600 kcal. Use the calculator above to find your exact maintenance number; then add or subtract 250–500 kcal for a mild bulk or cut. Avoid going below roughly 1,200 kcal/day for women or 1,500 kcal/day for men without medical supervision.",
  },
  {
    q: "What is TDEE?",
    short:
      "TDEE stands for Total Daily Energy Expenditure — the total number of calories your body burns in a 24-hour period including your basal metabolic rate, daily activity, and exercise. Eat at your TDEE and your weight stays stable; eat below it and you lose weight; eat above it and you gain. The calculator above estimates TDEE from your BMR using a standard activity multiplier.",
  },
  {
    q: "Is Mifflin-St Jeor accurate?",
    short:
      "The Mifflin-St Jeor equation is the most accurate non-body-composition BMR formula for most adults — it predicts calories within roughly 10% for about 70% of people, which is better than the older Harris-Benedict equations. The Katch-McArdle formula is more accurate still, but only when you have a reliable body-fat percentage; if your body-fat number is a guess, Mifflin is the safer default.",
  },
  {
    q: "How many calories are in a pound?",
    short:
      "There are roughly 3,500 calories in a pound of stored body fat. A daily deficit of 500 kcal therefore works out to about one pound of fat lost per week, and a 250 kcal deficit to about half a pound per week. The 3,500 kcal-per-pound rule is a useful planning estimate but not exact — real-world fat loss is rarely linear.",
  },
];
