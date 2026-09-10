import { Polar } from "@polar-sh/sdk";
import type { Subscription as AppSubscription, SubscriptionTier } from "@/app/types";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
});

const PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  ...(process.env.POLAR_PLUS_PRODUCT_ID
    ? { [process.env.POLAR_PLUS_PRODUCT_ID]: "plus" }
    : {}),
  ...(process.env.POLAR_PRO_PRODUCT_ID
    ? { [process.env.POLAR_PRO_PRODUCT_ID]: "pro" }
    : {}),
};

type PolarSubscription = Awaited<ReturnType<typeof polar.subscriptions.get>>;

export function resolveTier(productId: string): SubscriptionTier {
  const bare = productId.replace(/^prod_/, "");
  return (
    PRODUCT_TIER_MAP[productId] ??
    PRODUCT_TIER_MAP[`prod_${bare}`] ??
    "free"
  );
}

export function resolveStatus(status: string): AppSubscription["status"] {
  return ["active", "canceled", "past_due", "trialing", "unpaid"].includes(
    status,
  )
    ? (status as AppSubscription["status"])
    : "active";
}

export function toAppSubscription(
  subscription: Pick<
    PolarSubscription,
    "id" | "customerId" | "productId" | "status"
  >,
): AppSubscription {
  return {
    tier: resolveTier(subscription.productId),
    status: resolveStatus(subscription.status),
    polarSubscriptionId: subscription.id,
    polarCustomerId: subscription.customerId,
    polarProductId: subscription.productId,
    updatedAt: Date.now(),
  };
}

/**
 * Returns recognized active subscriptions for a Firebase user. The external
 * customer ID is the Firebase UID assigned during checkout, so this remains
 * usable even when the Firestore subscription document is stale or missing.
 */
export async function findActivePolarSubscriptions(uid: string) {
  if (!process.env.POLAR_ACCESS_TOKEN) return [];

  const page = await polar.subscriptions.list({
    externalCustomerId: uid,
    active: true,
    limit: 20,
  });

  return page.result.items.filter((subscription) => {
    return resolveTier(subscription.productId) !== "free";
  });
}

/**
 * If duplicate subscriptions already exist, prefer the highest recognized
 * tier, then the most recently modified one. New upgrades never create a
 * second subscription, but this keeps the app's displayed access consistent
 * while an older duplicate is being handled in Polar.
 */
export function selectPreferredSubscription<
  T extends Pick<PolarSubscription, "productId" | "modifiedAt" | "createdAt">,
>(subscriptions: T[]): T | null {
  const tierRank: Record<SubscriptionTier, number> = {
    free: 0,
    plus: 1,
    pro: 2,
  };

  return [...subscriptions].sort((a, b) => {
    const tierDifference =
      tierRank[resolveTier(b.productId)] - tierRank[resolveTier(a.productId)];
    if (tierDifference !== 0) return tierDifference;

    const bTime = (b.modifiedAt ?? b.createdAt).getTime();
    const aTime = (a.modifiedAt ?? a.createdAt).getTime();
    return bTime - aTime;
  })[0] ?? null;
}

export async function hasProSubscription(uid: string): Promise<boolean> {
  const subscriptions = await findActivePolarSubscriptions(uid);
  const preferred = selectPreferredSubscription(subscriptions);
  return preferred ? resolveTier(preferred.productId) === "pro" : false;
}

export async function hasPaidSubscription(uid: string): Promise<boolean> {
  const subscriptions = await findActivePolarSubscriptions(uid);
  const preferred = selectPreferredSubscription(subscriptions);
  const tier = preferred ? resolveTier(preferred.productId) : "free";
  return tier === "plus" || tier === "pro";
}

export function isoDate(value: Date | null | undefined): string | null {
  return value instanceof Date ? value.toISOString() : null;
}
