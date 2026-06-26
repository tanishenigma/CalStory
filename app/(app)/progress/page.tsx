import type { Metadata } from "next";
import ProgressClient from "./ProgressClient";

export const metadata: Metadata = {
  // Final tab title: "Progress | CalStory" (19 chars).
  title: "Progress",
  description:
    "Track your CalStory progress with streak heatmaps, calorie-vs-TDEE charts, weekly averages, weight trend, BMI and consistency in one dashboard.",
  alternates: { canonical: "/progress" },
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return <ProgressClient />;
}
