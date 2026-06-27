"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { getAuthHint } from "@/app/lib/storage";
import type { Profile } from "@/app/types";

export function useAuthGuard(): {
  profile: Profile | null | undefined;
  isLoading: boolean;
} {
  const router = useRouter();
  const { state } = useApp();
  const { user, loading } = useAuthStore();
  const { profile } = state;
  const timedOut = useRef(false);

  // ── Paranoia timeout ──
  // Most refreshes now resolve synchronously from the cached auth hint,
  // so this only fires if Firebase genuinely never responds (offline,
  // blocked CDN, etc.). Kept short so a stuck page redirects quickly
  // instead of staring at a spinner for 5 seconds.
  useEffect(() => {
    const t = setTimeout(() => {
      timedOut.current = true;
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Still loading only if BOTH conditions hold:
  //   1. Firebase auth hasn't resolved (`loading === true`), AND
  //   2. We don't have a cached auth hint we can render against.
  // If we have a cached user (synchronous boot from localStorage), we
  // can render the page immediately while Firebase re-validates in the
  // background — the cached user is "best-effort signed in" until the
  // listener confirms or denies.
  const cachedHint = getAuthHint();
  const hasCache = !!cachedHint?.uid;
  const isLoading =
    (loading || profile === undefined) && !hasCache && !timedOut.current;

  useEffect(() => {
    if (loading && !hasCache) return; // still waiting for Firebase, no cache
    if (!user) {
      router.replace("/");
      return;
    }
    // Only redirect to onboarding if the user has no profile OR the
    // profile exists but is missing the `onboardedAt` flag (e.g. legacy
    // account created before this field was added). If `profile` is
    // `undefined`, we're still loading from Firestore.
    if (profile === null || (profile && !profile.onboardedAt)) {
      router.replace("/onboarding");
    }
  }, [profile, user, loading, router, hasCache]);

  return { profile, isLoading };
}

export const Spinner: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
      }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-ink)",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
};
