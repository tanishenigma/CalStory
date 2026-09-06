import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "CalStory settings — manage your profile, units, theme, navbar style and Gemini API key. Sign out of your account and clear local cached data here.",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: false },
};

interface SettingsPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = (await searchParams) ?? {};

  return <SettingsClient initialTabParam={params.tab} />;
}
