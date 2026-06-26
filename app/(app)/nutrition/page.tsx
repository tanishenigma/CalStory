import type { Metadata } from "next";
import NutritionClient from "./NutritionClient";

export const metadata: Metadata = {
  // Final tab title: "Nutrition | CalStory" (20 chars).
  title: "Nutrition",
  description:
    "Log meals, search foods and track daily macros on CalStory's nutrition page. AI-powered food logging in under ten seconds, with recents and recipes.",
  alternates: { canonical: "/nutrition" },
  robots: { index: false, follow: false },
};

export default function NutritionPage() {
  return <NutritionClient />;
}
