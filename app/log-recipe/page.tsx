import type { Metadata } from "next";
import LogRecipeClient from "./LogRecipeClient";

export const metadata: Metadata = {
  // Final tab title: "Log Recipe | CalStory" (21 chars).
  title: "Log Recipe",
  description:
    "Log a multi-ingredient recipe to CalStory with full calorie and macro breakdown, serving size, repeat-across-days and recipe-as-template options.",
  alternates: { canonical: "/log-recipe" },
  robots: { index: false, follow: false },
};

export default function LogRecipePage() {
  return <LogRecipeClient />;
}
