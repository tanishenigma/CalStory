"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { PageSkeleton } from "@/app/components/PageSkeleton";
import type { Profile } from "@/app/types";

type Variant = "dashboard" | "nutrition" | "workouts" | "progress" | "settings";

function variantFromPath(pathname: string | null): Variant {
  if (!pathname) return "dashboard";
  if (pathname.startsWith("/nutrition")) return "nutrition";
  if (pathname.startsWith("/workouts")) return "workouts";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

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
  // Firebase `onAuthStateChanged` should resolve near-instantly from
  // IndexedDB. This 1.5s ceiling only fires when Firebase genuinely
  // never responds (offline, blocked CDN, etc.) — in which case we
  // fall through to the redirect logic below instead of staring at
  // a skeleton forever.
  useEffect(() => {
    const t = setTimeout(() => {
      timedOut.current = true;
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Loading = Firebase auth listener hasn't fired yet AND we haven't
  // been waiting too long. Once it fires (with or without a user),
  // we hand off to the redirect effect below.
  const isLoading = loading && !timedOut.current;

  useEffect(() => {
    if (loading) return; // still waiting for Firebase
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
  }, [profile, user, loading, router]);

  return { profile, isLoading };
}

/**
 * Auth-loading placeholder.
 *
 * Default behaviour: matches the layout of the page being loaded so
 * the swap to live content is imperceptible — no CLS jump. Pages that
 * live under a sub-route (e.g. /settings/profile) can override the
 * `variant` to get the right skeleton shape.
 *
 * Pass `compact` for cases where the page has its own rich UI (e.g.
 * /onboarding's multi-step form) and a centred spinner is the right
 * "I'm still loading the auth state" placeholder.
 */
export const Spinner: React.FC<{ variant?: Variant; compact?: boolean }> = ({
  variant,
  compact,
}) => {
  const pathname = usePathname();
  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}>
        <div
          aria-hidden="true"
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
  }
  return <PageSkeleton variant={variant ?? variantFromPath(pathname)} />;
};
