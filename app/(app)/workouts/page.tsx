import type { Metadata } from "next";
import WorkoutsClient from "./WorkoutsClient";

export const metadata: Metadata = {
  // Final tab title: "Workouts | CalStory" (19 chars).
  title: "Workouts",
  description:
    "Log strength, HIIT, cardio, yoga, pilates and sport workouts in CalStory. Save workouts as templates and re-log them with one tap from any day.",
  alternates: { canonical: "/workouts" },
  robots: { index: false, follow: false },
};

export default function WorkoutsPage() {
  return <WorkoutsClient />;
}
