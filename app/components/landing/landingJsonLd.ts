import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Centralised JSON-LD for the landing page.
 *
 * Six payloads:
 *   1. Organization        — establishes brand entity across the web
 *   2. SoftwareApplication — describes the product (rich result eligibility)
 *   3. WebSite             — sitelinks search box + parent of WebPage
 *   4. WebPage             — anchors the landing page to its canonical URL
 *   5. BreadcrumbList      — single-item trail: Home. Helps Google
 *                            understand the site hierarchy and is the
 *                            schema most likely to surface in sitelinks.
 *   6. FAQPage             — mirrors the FAQSection component content
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
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.svg`,
      width: 512,
      height: 512,
    },
    description:
      "CalStory is a free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log with an AI food logger — built for lifters who care about real progress.",
    keywords:
      "calorie, calorie calculator, calorie deficit, calorie deficit calculator, maintenance calorie calculator, calorie counter, calorie tracker, workout log, workout routines, best workout apps, what is a calorie, what is a calorie deficit",
    sameAs: [
      "https://github.com/tanishenigma/CalStory",
      "https://twitter.com/calstoryapp",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CalStory",
    alternateName: "CalStory Calorie Tracker",
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Calorie & Macro Tracker",
    operatingSystem: "Web, iOS, Android (PWA)",
    description:
      "Free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log. Log meals with AI, track macros, record workout routines, and watch real progress.",
    url: SITE_URL,
    image: `${SITE_URL}/og.png`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1200",
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "AI calorie counter and calorie tracker",
      "Calorie calculator and maintenance calorie calculator",
      "Calorie deficit calculator with weekly auto-tune",
      "Macro tracking (protein, carbs, fat)",
      "Workout log for strength, cardio, HIIT, yoga, sports",
      "Saveable workout routines as templates",
      "Progress charts and 16-week consistency heatmap",
      "Streak tracking",
      "TDEE calculator",
      "BMR calculator",
    ],
    keywords:
      "calorie, calorie calculator, calorie deficit calculator, maintenance calorie calculator, calorie counter, calorie tracker, workout log, workout routines, best workout apps",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "CalStory",
    url: SITE_URL,
    description:
      "Free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log with AI food logging.",
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    name: "CalStory — Free Calorie Tracker, Calorie Counter & Workout Log",
    url: SITE_URL,
    description:
      "CalStory is the free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log built for lifters. Log meals with AI, hit your macros, and track every set — no spreadsheets required.",
    inLanguage: "en-US",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${SITE_URL}/og.png`,
      width: 1200,
      height: 630,
    },
    keywords:
      "calorie, calorie calculator, calorie deficit calculator, calorie deficit, maintenance calorie calculator, calorie counter, what is a calorie deficit, what is a calorie, calorie tracker, best workout apps, workout routines, workout log",
    significantLink: [
      `${SITE_URL}/dashboard`,
      `${SITE_URL}/nutrition`,
      `${SITE_URL}/workouts`,
      `${SITE_URL}/progress`,
      `${SITE_URL}/blog`,
      `${SITE_URL}/blog/calorie-tracking-for-beginners`,
      `${SITE_URL}/blog/best-macro-calculator`,
    ],
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: [
        "/html/head/title",
        "/html/head/meta[@name='description']/@content",
      ],
    },
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
    /* Landing FAQ now answers pre-purchase product questions
     * (onboarding, pricing, trust, devices, support) — the queries
     * a *prospective* user is asking right before they sign up.
     *
     * Calorie-keyword queries (what is a calorie, what is a calorie
     * deficit, calorie-deficit math, the 3-3-3 rule, etc.) now
     * live as blog posts and the calorie-deficit FAQ on /about.
     * Routing the high-volume discovery keywords to dedicated
     * articles keeps the search traffic intact while letting the
     * landing FAQ speak to pre-purchase intent. */
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I get started?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Getting started with CalStory takes about three minutes: sign in with Google or email, set your stats in onboarding (age, height, weight, activity), and the app calculates your TDEE and macro targets. Your first meal log takes under 10 seconds with the AI food logger.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to install anything?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No installation needed — CalStory runs entirely in the browser as a web app. There is nothing to download on desktop or mobile. Add the site to your home screen and it behaves like a native app (PWA) with offline support for already-loaded screens.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CalStory has no trial because every feature is already free — there is no premium tier, no paywall, no credit card required. AI food logging runs on a shared quota (~30-50 logs/day) that covers normal use; paste your own Gemini API key in Settings for unlimited AI logs billed to your own Google account.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "There is nothing to cancel — CalStory has no subscription, no recurring charges, and no accounts in the billing sense. Your data lives in your own Firebase project (or your self-hosted Postgres), and you can delete it permanently from Settings at any time.",
        },
      },
      {
        "@type": "Question",
        name: "Is my data safe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — CalStory is open source, your data lives in your own Firebase project, and Firestore security rules restrict reads and writes to the authenticated user only. There is no CalStory-controlled server that touches your data, no analytics, no ad pixels, and no third-party tracking.",
        },
      },
      {
        "@type": "Question",
        name: "Who can see my information?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Only you. CalStory has no social features, no public profiles, no leaderboards, and no data-sharing with third parties. Your meals, workouts, weight, and profile are stored in your own Firebase project and only accessible to your authenticated account.",
        },
      },
      {
        "@type": "Question",
        name: "Does this work on mobile and Windows?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — CalStory is a responsive web app that works on iOS, Android, Windows, macOS, and Linux browsers. On phones it installs to your home screen as a PWA and behaves like a native app. The only requirement is a modern browser (Chrome, Safari, Firefox, Edge released in the last two years).",
        },
      },
      {
        "@type": "Question",
        name: "What if I need help?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Help is available three ways: in-app help links for common questions, a GitHub Issues tracker for bug reports and feature requests, and direct email support at support@calstory.app. There is no support tier to unlock — every channel is free for every user.",
        },
      },
      {
        "@type": "Question",
        name: "Is there customer support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — direct, human support via support@calstory.app. There is no support tier to unlock, no chatbot, no offshore call center. Most replies land within two business days; complex account issues can take up to a week.",
        },
      },
    ],
  },
];

// Re-export for sitemap typing
export type _SitemapType = MetadataRoute.Sitemap;
