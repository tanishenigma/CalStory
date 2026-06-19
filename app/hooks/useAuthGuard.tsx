"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
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

  // Safety timeout: if loading stays true for more than 5s, treat as unauthenticated
  useEffect(() => {
    const t = setTimeout(() => {
      timedOut.current = true;
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  // Auth is loading if Firebase hasn't resolved AND we haven't timed out
  const isLoading = (loading || profile === undefined) && !timedOut.current;

  useEffect(() => {
    if (loading) return; // still waiting for Firebase auth
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
          border: "3px solid #E8E7E4",
          borderTopColor: "#1A1916",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
};
