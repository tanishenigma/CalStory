"use client";

import PricingSection from "@/app/components/landing/PricingSection";
import { RouteThemeController } from "@/app/components/RouteThemeController";
import { PublicPageShell } from "@/app/components/landing-redesign/PublicPageShell";

const FAQ_ITEMS = [
  {
    q: "Is CalStory really free?",
    a: "Yes — core calorie tracking, full workout logging, macro targets, and 5 AI prompts per day are free with no credit card required.",
  },
  {
    q: "What counts as an AI meal log?",
    a: 'Any time you describe a meal in natural language and let Gemini estimate the macros for you. Manual food search and recipe entry are always unlimited on every plan.',
  },
  {
    q: "Can I cancel at any time?",
    a: "Absolutely. Subscriptions are month-to-month with no contracts. Cancel from your Polar customer portal and you keep access until the end of the billing period.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Polar accepts all major credit and debit cards (Visa, Mastercard, Amex) and most regional payment methods via Stripe.",
  },
  {
    q: "Is there a free trial for Plus or Pro?",
    a: "Not currently — but the free tier is comprehensive enough that you can evaluate the app before upgrading. Reach out via the contact page if you have questions.",
  },
  {
    q: "What is adaptive TDEE recalculation?",
    a: "Plus subscribers get their calorie targets automatically adjusted every week based on their actual logged intake and weight trend — so your targets stay accurate as your body composition changes.",
  },
];

export default function PricingClient() {
  return (
    <PublicPageShell>
      {/* Force the same light theme used on the landing page */}
      <RouteThemeController />

      <main className="min-h-screen pt-20">
        {/* ── Tier cards (reused from landing) ── */}
        <PricingSection />

        {/* ── FAQ ── */}
        <section
          aria-labelledby="faq-heading"
          className="max-w-2xl mx-auto px-6 pb-28 pt-4"
        >
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight font-heading text-foreground mb-8 text-center"
          >
            Frequently asked questions
          </h2>
          <dl className="space-y-6">
            {FAQ_ITEMS.map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-6">
                <dt className="font-semibold text-foreground mb-2">{q}</dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

    </PublicPageShell>
  );
}
