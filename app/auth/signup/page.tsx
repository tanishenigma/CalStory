import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  // Final tab title: "Sign up | CalStory" (19 chars).
  title: "Sign up",
  description:
    "Create a CalStory account to track calories, workouts and progress. Sign up with email or Google.",
  alternates: { canonical: "/auth/signup" },
  // Auth pages must never be indexed — search engines indexing the
  // popup-redirect target can produce duplicate or stale SERP entries.
  robots: { index: false, follow: false },
};

/**
 * /auth/signup — thin server component wrapper that owns the route's metadata.
 * The actual page body lives in `SignupClient.tsx` because it needs
 * client-side Firebase Auth + React hooks. The App Router requires
 * `metadata` to be exported from a server component, so the wrapper
 * pattern is the canonical way to keep both.
 */
export default function SignupPage() {
  return <SignupClient />;
}
