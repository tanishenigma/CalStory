import type { Metadata } from "next";
import { PrivacyClient } from "./PrivacyClient";

export const metadata: Metadata = {
  // Final tab title: "Privacy Policy | CalStory" (26 chars).
  title: "Privacy Policy",
  description:
    "How CalStory collects, stores and protects your data — open source, your Firebase project, your Gemini API key, your Firestore rules, your data.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
