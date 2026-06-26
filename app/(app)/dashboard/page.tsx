import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  // Final tab title: "Dashboard | CalStory" (20 chars).
  title: "Dashboard",
  description:
    "Your CalStory dashboard — today's calories, macros, meals and workouts at a glance, with a weekly strip and a quick-add log for fast daily entry.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
