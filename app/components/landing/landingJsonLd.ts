import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Centralised JSON-LD for the landing page.
 * Three payloads:
 *   1. Organization        — establishes brand entity across the web
 *   2. SoftwareApplication — describes the product (rich result eligibility)
 *   3. FAQPage             — mirrors the FAQSection component content
 *
 * Keep the FAQ list in sync with app/components/landing/FAQSection.tsx.
 */
export const landingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CalStory",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "CalStory is a free calorie, macro, and workout tracker with an AI food logger.",
    sameAs: [
      "https://github.com/tanishenigma",
      "https://twitter.com/calstoryapp",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalStory",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Calorie & Macro Tracker",
    operatingSystem: "Web",
    description:
      "Log meals with AI, track macros, record workouts, and watch real progress — free.",
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "AI food logging",
      "Macro tracking (protein, carbs, fat)",
      "Workout logging with sets, reps, and weight",
      "TDEE and macro calculator",
      "Progress charts and consistency heatmap",
      "Streak tracking",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does AI meal logging work in CalStory?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tap 'Log with AI', describe what you ate in plain language and CalStory extracts the calories and macros. You review and confirm before anything is saved.",
        },
      },
      {
        "@type": "Question",
        name: "How does CalStory calculate my TDEE?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CalStory uses the Mifflin-St Jeor equation with your height, weight, age, and weekly workout count. As you log weight, the trend line adapts so your targets stay accurate.",
        },
      },
      {
        "@type": "Question",
        name: "What does the streak counter track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your streak counts consecutive days where you've logged at least one meal. The Progress page shows a 16-week consistency heatmap so you can spot patterns.",
        },
      },
      {
        "@type": "Question",
        name: "Is my CalStory data stored securely?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CalStory is open source. You deploy it to your own environment with your own Firebase project and API keys. Your data never touches our servers because there are no 'our servers'.",
        },
      },
      {
        "@type": "Question",
        name: "Is CalStory free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. CalStory is free to use. An optional personal Gemini API key unlocks unlimited AI food logging without rate limits.",
        },
      },
    ],
  },
];

// Re-export for sitemap typing
export type _SitemapType = MetadataRoute.Sitemap;
