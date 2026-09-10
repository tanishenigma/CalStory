import { type NextRequest, NextResponse } from "next/server";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import {
  findActivePolarSubscriptions,
  isoDate,
  polar,
  resolveTier,
  selectPreferredSubscription,
  toAppSubscription,
} from "@/app/lib/polar-billing";
import { writeSubscription } from "@/app/lib/server-firestore";
import type { SubscriptionTier } from "@/app/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://calstory.app";

export async function GET(req: NextRequest) {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan");
  const productId =
    plan === "plus"
      ? process.env.POLAR_PLUS_PRODUCT_ID
      : plan === "pro"
        ? process.env.POLAR_PRO_PRODUCT_ID
        : null;

  // ── Guard: access token not yet configured ─────────────────────────
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error: "Polar not configured",
        hint: "Set POLAR_ACCESS_TOKEN in .env — see docs/polar-setup.md",
      },
      { status: 503 },
    );
  }

  // ── Guard: plan required ───────────────────────────────────────────
  if (!productId) {
    return NextResponse.json(
      { error: "This plan is not configured for checkout" },
      { status: 503 },
    );
  }

  const bareProductId = productId.replace(/^prod_/, "");

  try {
    // A paid customer must update their existing subscription. Creating a
    // second checkout here would charge the full new plan and can leave two
    // active subscriptions for the same Firebase user.
    const activeSubscriptions = await findActivePolarSubscriptions(auth.uid);
    const existingSubscription = selectPreferredSubscription(activeSubscriptions);

    if (existingSubscription) {
      const currentTier = resolveTier(existingSubscription.productId);
      const requestedTier = plan as Exclude<SubscriptionTier, "free">;

      if (currentTier === requestedTier) {
        return NextResponse.json({
          ok: true,
          mode: "already_active",
          plan: currentTier,
          message: `Your ${currentTier} plan is already active.`,
        });
      }

      if (currentTier === "pro") {
        return NextResponse.json(
          {
            error: "Your Pro plan is already active. Manage your subscription from Billing.",
          },
          { status: 409 },
        );
      }

      if (currentTier === "plus" && requestedTier === "pro") {
        if (existingSubscription.cancelAtPeriodEnd) {
          return NextResponse.json(
            {
              error:
                "Your Plus subscription is scheduled to cancel. Resume it in Manage before upgrading.",
            },
            { status: 409 },
          );
        }

        const updated = await polar.subscriptions.update({
          id: existingSubscription.id,
          subscriptionUpdate: {
            productId: bareProductId,
            // Charge only the prorated difference for the unused Plus period.
            // The customer pays the regular Pro price at the next renewal.
            prorationBehavior: "invoice",
          },
        });
        const subscription = toAppSubscription(updated);
        await writeSubscription(auth.uid, auth.idToken, subscription);

        return NextResponse.json({
          ok: true,
          mode: "upgraded",
          plan: subscription.tier,
          amount: updated.amount,
          currency: updated.currency,
          currentPeriodEnd: isoDate(updated.currentPeriodEnd),
          message:
            "Upgraded to Pro. Only the prorated difference was charged today; $14/month applies at renewal.",
        });
      }
    }

    const checkout = await polar.checkouts.create({
      products: [bareProductId],
      externalCustomerId: auth.uid,
      metadata: { firebaseUid: auth.uid },
      successUrl: `${SITE_URL}/dashboard?welcome=1&checkout_id={CHECKOUT_ID}`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[polar/checkout] Error creating checkout session:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: message },
      { status: 500 },
    );
  }
}
