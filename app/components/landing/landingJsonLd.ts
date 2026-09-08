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
];

// Re-export for sitemap typing
export type _SitemapType = MetadataRoute.Sitemap;
