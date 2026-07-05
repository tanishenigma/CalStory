/**
 * faqData — server-side module that holds the canonical
 * `question + plain-text answer` pairs used by both:
 *   • the `<CalorieDeficitFaq />` client component (renders the
 *     full JSX answers; this module only feeds it the questions)
 *   • the page-level FAQPage JSON-LD on `/about` (consumes the
 *     `short` strings directly).
 *
 * Keeping the JSON-LD data here, in a non-`use client` module,
 * avoids the "value-as-exported-from-client-component" boundary
 * error Next 16 raises when the server component reads a value
 * out of a `"use client"` file at build time.
 *
 * Keep this list and the Q/A JSX in
 * `app/about/CalorieDeficitFaq.tsx` in lockstep — the build
 * process does not enforce parity, but a divergence would break
 * both the visible copy and the JSON-LD rich-result eligibility.
 */

export type AboutFaq = {
  q: string;
  short: string;
};

export const ABOUT_FAQS: ReadonlyArray<AboutFaq> = [
  {
    q: "How do I calculate my calorie deficit?",
    short:
      "To calculate a calorie deficit, find your TDEE (the calories your body burns daily from age, weight, height, activity, and training), then subtract 250-750 calories depending on how aggressive you want fat loss. CalStory runs this calculation for you and auto-refines the target as you log weight.",
  },
  {
    q: "What should my calorie deficit be?",
    short:
      "Most people do best with a 300-500 calorie deficit per day for steady fat loss of about 0.5-1 lb/week without losing muscle or energy. Lifters and runners often lean toward the smaller end to keep performance. CalStory sets a personalized deficit target based on your stats and auto-adjusts it weekly.",
  },
  {
    q: "How much calorie deficit do I need to lose weight?",
    short:
      "Losing one pound of fat requires roughly a 3,500-calorie deficit, so 500 kcal/day under TDEE loses about 1 lb/week. Sustainable plans stay in the 300-750 kcal/day range; bigger deficits lose more muscle and energy. CalStory's calorie ring shows exactly where you land against your target every day.",
  },
  {
    q: "Is 1000 calories a day good for weight loss?",
    short:
      "1,000 calories a day is almost always too low for active adults and lifters, and it usually causes muscle loss, fatigue, and metabolic adaptation. A safer daily target is a 300-500 calorie deficit below your maintenance calories. CalStory sets your deficit automatically based on your TDEE, so you cut without crushing performance.",
  },
  {
    q: "Can you build muscle in a calorie deficit?",
    short:
      "Yes — body recomposition (gaining muscle while losing fat) is possible in a mild deficit with consistent strength training and 0.7-1 g protein per pound of bodyweight. Beginners and returning lifters see the best results. CalStory's workout log and macro targets are built to keep protein high and track training volume during a cut.",
  },
  {
    q: "How do I eat in a calorie deficit?",
    short:
      "Eating in a calorie deficit means prioritizing protein and fiber-rich, high-volume foods that keep you full on fewer calories while still hitting your daily calorie and macro targets. Plan meals ahead of hunger. CalStory's AI logger makes tracking effortless — describe your meal in plain English and it handles the breakdown.",
  },
  {
    q: "How do I stay in a calorie deficit consistently?",
    short:
      "Staying in a calorie deficit long-term is about consistency, not perfection. Set a realistic deficit, track daily, and adjust your target as your TDEE changes with weight loss. CalStory's streak tracking and 16-week consistency heatmap help you stay accountable day to day until the deficit becomes a habit.",
  },
  {
    q: "How do I use a calorie deficit calculator?",
    short:
      "A calorie deficit calculator finds your maintenance calories (TDEE), then subtracts a daily deficit — usually 300-500 kcal — to set your weight-loss target. CalStory's built-in calorie deficit calculator runs on Mifflin-St Jeor, factors in your activity, and auto-adjusts as you log new weight entries.",
  },
  {
    q: "What is the best calorie calculator to lose weight?",
    short:
      "The best calorie calculator to lose weight combines an accurate BMR formula (Mifflin-St Jeor) with a real activity factor and weekly auto-tuning from logged weight. CalStory does all three, then layers on AI food logging and macro tracking so the calculator becomes an actual daily tracker, not just a one-shot number.",
  },
  {
    q: "Is there a free food calorie calculator?",
    short:
      "Yes — CalStory's free food calorie calculator combines an AI food logger with the FatSecret nutrition database, so you can search any food or type a meal in plain English to get calories and macros in seconds. Nothing to install, no paywall on the core flow.",
  },
];
