import type { Metadata } from "next";
import { CookiesClient } from "./CookiesClient";

export const metadata: Metadata = {
  // Final tab title: "Cookie Policy | CalStory" (24 chars).
  title: "Cookie Policy",
  description:
    "How CalStory uses cookies, local storage and similar technologies — what is stored on your device, what is not, and how to clear it.",
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return <CookiesClient />;
}
