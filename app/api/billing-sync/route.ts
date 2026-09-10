import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { writeSubscription } from "@/app/lib/server-firestore";
import {
  findActivePolarSubscriptions,
  isoDate,
  selectPreferredSubscription,
  toAppSubscription,
} from "@/app/lib/polar-billing";

// POST /api/billing-sync
// Looks up any active Polar subscription for this user (by externalCustomerId = Firebase UID)
// and writes it to Firestore. Fixes the case where the webhook never fired (e.g. local dev).
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  try {
    // Find active subscriptions for this Firebase user via externalCustomerId
    const subscriptions = await findActivePolarSubscriptions(auth.uid);
    const sub = selectPreferredSubscription(subscriptions);
    if (!sub) {
      return NextResponse.json({ ok: false, reason: "no_active_subscription" });
    }

    const subscription = toAppSubscription(sub);

    await writeSubscription(auth.uid, auth.idToken, subscription);

    console.log(`[billing-sync] Synced: uid=${auth.uid} tier=${subscription.tier} sub=${sub.id}`);
    return NextResponse.json({
      ok: true,
      plan: subscription.tier,
      status: subscription.status,
      subscription: {
        currentPeriodEnd: isoDate(sub.currentPeriodEnd),
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        amount: sub.amount,
        currency: sub.currency,
        interval: sub.recurringInterval,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[billing-sync] Failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
