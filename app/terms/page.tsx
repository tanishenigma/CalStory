import type { Metadata } from "next";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  // Final tab title: "Terms of Service | CalStory" (28 chars).
  title: "Terms of Service",
  description:
    "Terms of using CalStory — a free calorie, macro and workout tracker. Read the rules for the app, AI-powered logging and self-hosted deployments.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <TermsClient />;
}
