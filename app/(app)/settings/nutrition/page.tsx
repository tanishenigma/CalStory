import type { Metadata } from "next";
import EditNutritionGoalsClient from "./EditNutritionGoalsClient";

export const metadata: Metadata = {
  // Final tab title: "Edit Nutrition Goals | CalStory" (32 chars).
  title: "Edit Nutrition Goals",
  description:
    "Recalibrate your calorie and macro targets in CalStory — TDEE, deficit or surplus intensity, macro split and per-kg protein floor for lifters.",
  alternates: { canonical: "/settings/nutrition" },
  robots: { index: false, follow: false },
};

export default function EditNutritionGoalsPage() {
  return <EditNutritionGoalsClient />;
}
