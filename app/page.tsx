import type { Metadata } from "next";
import LandingClient from "./LandingClient";

const SITE_NAME = "CalStory";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

/**
 * Landing page metadata.
 *
 * In Next.js 16 the `Metadata` exported from a page *replaces* the
 * parent layout's title and *merges* every other field shallowly,
 * so the OG/Twitter/robots block defined in the root layout is
 * inherited here. We only need to override what is genuinely
 * landing-page-specific: the title, description, keywords,
 * canonical, and the OG/Twitter card copy that shows up when the
 * home URL is shared.
 */
export const metadata: Metadata = {
  title: `${SITE_NAME} — Free Calorie Tracker, Calorie Counter & Workout Log`,
  description:
    "CalStory is the free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log built for lifters. Log meals with AI, hit your macros, and track every set — no spreadsheets required.",
  keywords: [
    "calorie",
    "calorie calculator",
    "calorie deficit calculator",
    "calorie deficit",
    "maintenance calorie calculator",
    "calorie counter",
    "what is a calorie deficit",
    "what is a calorie",
    "calorie tracker",
    "best workout apps",
    "workout routines",
    "workout log",
    "macro tracker",
    "food logger",
    "AI food log",
    "workout tracker",
    "TDEE calculator",
    "macro calculator",
    "BMR calculator",
    "fitness tracker",
    "nutrition tracker",
    "weight loss tracker",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Calorie Tracker, Calorie Counter & Workout Log`,
    description:
      "Free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log with AI food logging. Built for lifters who care about real progress.",
    images: [
      {
        url: "/og.png",
        secureUrl: "/og.png",
        width: 1200,
        height: 630,
        alt: "CalStory — Free Calorie Tracker, Calorie Counter & Workout Log",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@calstoryapp",
    creator: "@calstoryapp",
    title: `${SITE_NAME} — Free Calorie Tracker, Calorie Counter & Workout Log`,
    description:
      "Free calorie tracker, calorie counter, calorie deficit calculator, maintenance calorie calculator, and workout log with AI food logging. Built for lifters who care about real progress.",
    images: {
      url: "/og.png",
      alt: "CalStory — Free Calorie Tracker, Calorie Counter & Workout Log",
    },
  },
};

export default function HomePage() {
  return <LandingClient />;
}
