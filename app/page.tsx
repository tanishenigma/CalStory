import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
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

export default function HomePage() {
  return <LandingClient />;
}
