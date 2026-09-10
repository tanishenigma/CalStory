import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";

// Reads stored subscription from Firestore via REST (same pattern as billing/route.ts)
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: (process.env.POLAR_SERVER ?? "sandbox") as "sandbox" | "production",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://calstory.app";

interface FirestoreSubscriptionDocument {
  fields?: {
    polarSubscriptionId?: { stringValue?: string };
    polarCustomerId?: { stringValue?: string };
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  try {
    // 1. Fetch stored subscription IDs from Firestore
    const fsRes = await fetch(
      `${FIRESTORE_BASE}/users/${auth.uid}/subscription/active`,
      { headers: { Authorization: `Bearer ${auth.idToken}` } },
    );
    if (fsRes.status === 404) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }
    if (!fsRes.ok) {
      return NextResponse.json({ error: "Could not read subscription" }, { status: 502 });
    }

    const doc = (await fsRes.json()) as FirestoreSubscriptionDocument;
    const subscriptionId = doc.fields?.polarSubscriptionId?.stringValue;
    const customerId = doc.fields?.polarCustomerId?.stringValue;

    if (!subscriptionId || !customerId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // 2. Create a short-lived customer session token
    const session = await polar.customerSessions.create({
      customerId,
      returnUrl: `${SITE_URL}/settings?tab=billing`,
    });

    // 3. Cancel the subscription via the customer portal API
    //    This sets cancelAtPeriodEnd = true (graceful cancel, not immediate revoke)
    const cancelled = await polar.customerPortal.subscriptions.cancel(
      { customerSession: session.token },
      { id: subscriptionId },
    );

    return NextResponse.json({
      ok: true,
      cancelAtPeriodEnd: cancelled.cancelAtPeriodEnd,
      currentPeriodEnd: cancelled.currentPeriodEnd instanceof Date
        ? cancelled.currentPeriodEnd.toISOString()
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cancel] Failed to cancel subscription:", message);
    return NextResponse.json(
      { error: "Failed to cancel subscription. Try again or use the billing portal." },
      { status: 500 },
    );
  }
}
