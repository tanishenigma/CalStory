import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "Set Up Your Profile",
  description:
    "Set up your CalStory profile in under a minute — weight, height, goal and training frequency. We calculate your daily calorie and macro targets automatically.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
