import type { Metadata } from "next";
import AuthClient from "./AuthClient";

export const metadata: Metadata = {
  // Final tab title: "Sign in | CalStory" (18 chars).
  title: "Sign in",
  description:
    "Sign in to CalStory with Google to track calories, workouts and progress. New here? Your account is created automatically on the very first sign-in.",
  alternates: { canonical: "/auth" },
  // Auth pages must never be indexed — search engines indexing the
  // popup-redirect target can produce duplicate or stale SERP entries.
  robots: { index: false, follow: false },
};

/**
 * /auth — thin server component wrapper that owns the route's metadata.
 * The actual page body lives in `AuthClient.tsx` because it needs
 * client-side Firebase Auth + React hooks. The App Router requires
 * `metadata` to be exported from a server component, so the wrapper
 * pattern is the canonical way to keep both.
 */
export default function AuthPage() {
  return <AuthClient />;
}
