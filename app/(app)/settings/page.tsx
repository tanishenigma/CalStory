import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  // Final tab title: "Settings | CalStory" (19 chars).
  title: "Settings",
  description:
    "CalStory settings — manage your profile, units, theme, navbar style and Gemini API key. Sign out of your account and clear local cached data here.",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
