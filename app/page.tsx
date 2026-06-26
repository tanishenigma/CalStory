import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  // Final tab title: "Free Calorie Tracker | CalStory" (32 chars).
  title: "Free Calorie Tracker",
  description:
    "CalStory is a free calorie, macro and workout tracker with an AI food logger. Track your TDEE, hit your macros, and build the story of your best self.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CalStory — Free Calorie Tracker",
    description:
      "Free calorie, macro and workout tracker with an AI food logger. Built for lifters.",
  },
};

/**
 * / — server wrapper that owns the page's metadata. The body is a
 * client component because the landing page uses Framer Motion, GSAP
 * and Lenis scroll. The App Router requires metadata to come from a
 * server component, so we wrap the client implementation here.
 */
export default function HomePage() {
  return <LandingClient />;
}
