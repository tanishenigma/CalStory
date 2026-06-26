import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";
import { StructuredData } from "@/app/components/seo/StructuredData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

export const metadata: Metadata = {
  // Final tab title: "About CalStory | CalStory" (24 chars).
  title: "About CalStory",
  description:
    "CalStory is an open-source calorie and macro tracker built by lifters. Self-hostable, no ads, no premium tier — your Firebase project, your API keys.",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "About CalStory",
    description:
      "An open-source calorie and macro tracker built by lifters. No premium tier, no ads.",
    url: `${SITE_URL}/about`,
    type: "profile",
  },
};

// AboutPage schema — helps Google understand the creator entity
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About CalStory",
  url: `${SITE_URL}/about`,
  description:
    "CalStory is an open-source calorie, macro and workout tracker built by tanishenigma.",
  isPartOf: {
    "@type": "WebSite",
    name: "CalStory",
    url: SITE_URL,
  },
};

export default function AboutPage() {
  return (
    <>
      <StructuredData data={aboutJsonLd} />
      <AboutClient />
    </>
  );
}
