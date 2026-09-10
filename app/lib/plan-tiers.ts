// app/lib/plan-tiers.ts
// Single source of truth for plan tier metadata (features, pricing, CTAs).
// Imported by both PricingSection (landing) and BillingTab (settings).

export const PLAN_TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    priceNote: "/ forever",
    intro: "The complete base tracker. No card, no trial.",
    inherits: null as string | null,
    features: [
      "Unlimited manual food logging",
      "Full workout tracker (sets × reps × kg)",
      "Calorie + macro targets",
      "Weight trend tracking",
      { mono: "16-week", rest: " streak heatmap" },
      "TDEE calculator",
      { mono: "5", rest: " AI prompts / day" },
    ] as Array<string | { mono: string; rest: string }>,
    cta: "Start free — no card",
  },
  {
    id: "plus" as const,
    name: "Plus",
    price: 7,
    priceNote: "/ mo",
    intro: null as string | null,
    inherits: "Free" as string | null,
    features: [
      "Unlimited AI meal logs",
      "Daily AI progress insights",
      "Adaptive TDEE recalculation",
      "Advanced macro split views",
      "Workout templates + re-log",
      "Ask Calibra for lifting + eating advice",
    ] as Array<string | { mono: string; rest: string }>,
    cta: "Get Plus",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 14,
    priceNote: "/ mo",
    intro: null as string | null,
    inherits: "Plus" as string | null,
    features: [
      "Data export (CSV / JSON)",
      "AI workout progress comparisons",
      "Time-aware meal re-use",
      "Priority support",
      "Early access to features in development",
    ] as Array<string | { mono: string; rest: string }>,
    cta: "Get Pro",
  },
];

export type PlanTier = (typeof PLAN_TIERS)[number];
export type PlanTierId = PlanTier["id"];
