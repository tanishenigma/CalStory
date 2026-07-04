import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Centralised JSON-LD for the landing page.
 * Four payloads:
 *   1. Organization        — establishes brand entity across the web
 *   2. SoftwareApplication — describes the product (rich result eligibility)
 *   3. WebPage             — anchors the landing page to its canonical URL
 *   4. BreadcrumbList      — single-item trail: Home. Helps Google
 *                            understand the site hierarchy and is the
 *                            schema most likely to surface in sitelinks.
 *   5. FAQPage             — mirrors the FAQSection component content
 *
 * Keep the FAQ list in sync with app/components/landing/FAQSection.tsx.
 */
export const landingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "CalStory",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "CalStory is a free calorie, macro, and workout tracker with an AI food logger.",
    sameAs: [
      "https://github.com/tanishenigma/CalStory",
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
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    name: "CalStory — Free Calorie & Macro Tracker for Lifters",
    url: SITE_URL,
    description:
      "Free calorie, macro, and workout tracker with an AI food logger. Built for lifters who care about real progress.",
    inLanguage: "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
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
          text: "Tap “Log with AI” and describe what you ate in plain language — for example, “two eggs, toast, and a protein shake.” The model returns a structured calorie and macro breakdown (calories, protein, carbs, fat, serving size) in 6–9 seconds. Every AI suggestion opens a review screen where you can edit any field before saving. The model also remembers your recent meals for one-tap re-logging. CalStory uses Google Gemini under the hood, with an optional personal API key in Settings to bypass shared quota.",
        },
      },
      {
        "@type": "Question",
        name: "How does CalStory calculate my TDEE?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CalStory uses the Mifflin-St Jeor equation as the starting point (10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5 for men or −161 for women), which is the most accurate of the standard formulas for most adults. The result is your BMR, which is then multiplied by an activity factor between 1.4 and 1.75 based on weekly workouts, daily step count, and job activity to give TDEE. CalStory also auto-tunes your calorie target in 50 kcal increments based on your 7-day weight trend from the Progress page — the same calibration approach MacroFactor uses.",
        },
      },
      {
        "@type": "Question",
        name: "What does the streak counter track?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Your streak counts consecutive days where you have logged at least one meal. A day only counts if the meal was saved on that calendar day, not backdated. Skipping one day does not reset the streak; missing two consecutive days does. The Progress page’s 16-week consistency heatmap is the more useful stat — it surfaces patterns you would never notice otherwise, like “I always skip Thursdays.”",
        },
      },
      {
        "@type": "Question",
        name: "Is my CalStory data stored securely?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. CalStory is open source and every line of the app and API is on GitHub. There is no CalStory-controlled server that touches your data. When you sign in, your data is read from and written to your own Firebase project (or your self-hosted Postgres). Your meals, workouts, weight, and profile are stored under users/{uid}/... paths with Firestore security rules that restrict reads and writes to the authenticated user. The only network calls your browser makes are to Firebase and to Google’s Gemini endpoint. We do not run analytics, ad pixels, or third-party tracking.",
        },
      },
      {
        "@type": "Question",
        name: "Is CalStory free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — every feature is free with no usage caps on the core flow and no premium tier. The only feature with a soft limit is AI food logging: the shared Gemini quota covers roughly 30–50 AI logs per day, and a personal Gemini API key in Settings bypasses it entirely with usage billed directly to your Google account. The repo is open source under a permissive license, so you can self-host the entire stack on Vercel + Firebase Spark plan for free.",
        },
      },
    ],
  },
];

// Re-export for sitemap typing
export type _SitemapType = MetadataRoute.Sitemap;
