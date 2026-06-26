import type { Metadata } from "next";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  // Final tab title: "Set Up Your Profile | CalStory" (28 chars).
  title: "Set Up Your Profile",
  description:
    "Set up your CalStory profile in under a minute — weight, height, goal and training frequency. We calculate your daily calorie and macro targets automatically.",
  alternates: { canonical: "/onboarding" },
  // Onboarding is a private flow — never let it leak into SERPs.
  robots: { index: false, follow: false },
};

/**
 * /onboarding — server wrapper. The body uses Firebase Auth and
 * Zustand state so it must be a client component, but the App Router
 * requires `metadata` to be exported from a server component. Keep
 * the wrapper thin and let OnboardingClient own the behavior.
 */
export default function OnboardingPage() {
  return <OnboardingClient />;
}
