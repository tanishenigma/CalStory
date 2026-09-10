"use client";

import { useEffect, useState } from "react";
import { getIdToken, type User } from "firebase/auth";
import type { SubscriptionTier } from "@/app/types";

export function useSubscriptionTier(user: User | null) {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    if (!user) {
      setTier(null);
      return;
    }

    const currentUser = user;
    const controller = new AbortController();

    async function loadTier() {
      try {
        const token = await getIdToken(currentUser);
        const response = await fetch("/api/billing", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = (await response.json()) as { plan?: SubscriptionTier };
        if (data.plan === "free" || data.plan === "plus" || data.plan === "pro") {
          setTier(data.plan);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        // Feature controls remain locked until the billing source confirms
        // Pro access. A billing-page error must never grant an entitlement.
      }
    }

    void loadTier();
    return () => controller.abort();
  }, [user]);

  return {
    tier,
    isPro: tier === "pro",
    isLoading: tier === null && user !== null,
  };
}
