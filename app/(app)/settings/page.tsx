import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "CalStory settings — manage your profile, preferences, subscription and billing details.",
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
