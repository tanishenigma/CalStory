import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { writeSubscription } from "@/app/lib/server-firestore";
import type { Subscription, SubscriptionTier } from "@/app/types";

const polar = new Polar({
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

function resolveTier(productId: string): SubscriptionTier {
  // Also try stripping the prod_ prefix in case env has prefixed IDs
  const bare = productId.replace(/^prod_/, "");
  return (
    PRODUCT_TIER_MAP[productId] ??
    PRODUCT_TIER_MAP[`prod_${bare}`] ??
    "free"
  );
}

// Called from the dashboard when ?welcome=1&checkout_id=xxx is present.
// Reads the completed checkout from Polar and writes the subscription to
// Firestore directly — a reliable fallback for when webhooks haven't fired yet
// (e.g. local dev without a tunnel, or webhook delivery delay).
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  const checkoutId = new URL(req.url).searchParams.get("checkout_id");
  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  try {
    const checkout = await polar.checkouts.get({ id: checkoutId });

    // Only act on succeeded checkouts
    if (checkout.status !== "succeeded") {
      return NextResponse.json({ ok: false, status: checkout.status });
    }

    const subscriptionId = checkout.subscriptionId;
    const customerId = checkout.customerId;
    const productId = checkout.productId;

    if (!subscriptionId || !customerId || !productId) {
      return NextResponse.json({ ok: false, reason: "no_subscription_on_checkout" });
    }

    const tier = resolveTier(productId);
    if (tier === "free") {
      // Product ID not in our map — don't overwrite anything
      return NextResponse.json({ ok: false, reason: "unknown_product", productId });
    }

    const subscription: Subscription = {
      tier,
      status: "active",
      polarSubscriptionId: subscriptionId,
      polarCustomerId: customerId,
      polarProductId: productId,
      updatedAt: Date.now(),
    };

    await writeSubscription(auth.uid, auth.idToken, subscription);

    console.log(
      `[checkout-success] Firestore updated: uid=${auth.uid} tier=${tier} sub=${subscriptionId}`,
    );

    return NextResponse.json({ ok: true, tier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout-success] Failed:", message);
    return NextResponse.json(
      { error: "Could not confirm checkout", detail: message },
      { status: 502 },
    );
  }
}
