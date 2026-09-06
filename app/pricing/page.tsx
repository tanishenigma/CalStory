import type { Metadata } from "next";
import PricingClient from "./PricingClient";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://calstory.app";

export const metadata: Metadata = {
  title: "Pricing — CalStory | Free, Plus & Pro Plans",
  description:
    "CalStory is free forever for core calorie and workout tracking. Upgrade to Plus ($7/mo) for unlimited AI meal logs and adaptive TDEE, or Pro ($14/mo) for data export and priority support.",
  keywords: [
    "calstory pricing",
    "calorie tracker pricing",
    "AI meal tracker",
    "nutrition app subscription",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/pricing`,
    siteName: "CalStory",
    title: "Pricing — CalStory | Free, Plus & Pro Plans",
    description:
      "Free forever for core tracking. Plus at $7/mo adds unlimited AI logs. Pro at $14/mo adds data export and priority support.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "CalStory Pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@calstoryapp",
    title: "Pricing — CalStory | Free, Plus & Pro Plans",
    description:
      "Free forever for core tracking. Plus at $7/mo adds unlimited AI logs. Pro at $14/mo adds data export and priority support.",
    images: { url: "/og.png", alt: "CalStory Pricing" },
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
