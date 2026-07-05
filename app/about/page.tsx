import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";
import CalorieDeficitFaq from "./CalorieDeficitFaq";
import { ABOUT_FAQS } from "./faqData";
import { StructuredData } from "@/app/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

export const metadata: Metadata = {
  // Final tab title: "About CalStory | CalStory" (24 chars).
  title: "About CalStory",
  description:
    "CalStory is an open-source calorie, macro, and workout tracker built by lifters. Plus a deep-dive calorie deficit FAQ — what a deficit is, how to calculate it, and how to stay in one without losing muscle.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
  keywords: [
    "calorie",
    "calorie calculator",
    "calorie deficit",
    "calorie deficit calculator",
    "maintenance calorie calculator",
    "calorie counter",
    "calorie tracker",
    "what is a calorie",
    "what is a calorie deficit",
    "how to calculate calorie deficit",
    "what should my calorie deficit be",
    "1000 calories a day",
  ],
  openGraph: {
    title: "About CalStory — Calorie Deficit FAQ for Lifters",
    description:
      "Open-source calorie, macro, and workout tracker built by lifters. Plus a deep-dive calorie deficit FAQ — what it is, how to calculate it, and how to stay in one without losing muscle.",
    url: `${SITE_URL}/about`,
    type: "profile",
    images: [
      {
        url: "/og.png",
        secureUrl: "/og.png",
        width: 1200,
        height: 630,
        alt: "About CalStory — Calorie Deficit FAQ for Lifters",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About CalStory — Calorie Deficit FAQ for Lifters",
    description:
      "Open-source calorie, macro, and workout tracker built by lifters. Plus a deep-dive calorie deficit FAQ.",
    images: {
      url: "/og.png",
      alt: "About CalStory — Calorie Deficit FAQ for Lifters",
    },
  },
};

// `StructuredData` only accepts a single payload at a time, but we
// emit two distinct JSON-LD blocks on this route: the bare
// AboutPage (page identity) + the FAQPage (rich result eligibility).
// The Fragment wrapper handles the array case at the React layer.
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About CalStory",
  url: `${SITE_URL}/about`,
  description:
    "CalStory is an open-source calorie, macro and workout tracker built by tanishenigma. Includes a calorie deficit deep-dive FAQ for lifters.",
  inLanguage: "en-US",
  isPartOf: {
    "@type": "WebSite",
    name: "CalStory",
    url: SITE_URL,
  },
};

const aboutFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  /* The `url` on the FAQPage entity points at the deep-link
   * (`#calorie-deficit-faq`) so search engines know the structured
   * data is anchored to that on-page section. */
  url: `${SITE_URL}/about#calorie-deficit-faq`,
  name: "Calorie Deficit FAQ",
  inLanguage: "en-US",
  isPartOf: {
    "@type": "AboutPage",
    url: `${SITE_URL}/about`,
  },
  mainEntity: ABOUT_FAQS.map(({ q, short }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: short },
  })),
};

export default function AboutPage() {
  return (
    <>
      <StructuredData data={[aboutJsonLd, aboutFaqJsonLd]} />
      <AboutClient />
    </>
  );
}
