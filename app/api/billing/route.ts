import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Subscription } from "@/app/types";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { getPromptUsage } from "@/app/lib/ai-quota";
import { writeSubscription } from "@/app/lib/server-firestore";
import {
  findActivePolarSubscriptions,
  isoDate,
  polar,
  selectPreferredSubscription,
  toAppSubscription,
} from "@/app/lib/polar-billing";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://calstory.app";

interface FirestoreSubscriptionDocument {
  fields?: {
    tier?: { stringValue?: string };
    status?: { stringValue?: string };
    polarSubscriptionId?: { stringValue?: string };
    polarCustomerId?: { stringValue?: string };
    polarProductId?: { stringValue?: string };
    updatedAt?: { integerValue?: string };
  };
}

async function getStoredSubscription(
  uid: string,
  idToken: string,
): Promise<Subscription | null> {
  const response = await fetch(
    `${FIRESTORE_BASE}/users/${uid}/subscription/active`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Subscription read failed (${response.status})`);
  }

  const data = (await response.json()) as FirestoreSubscriptionDocument;
  const fields = data.fields;
  const customerId = fields?.polarCustomerId?.stringValue;
  const subscriptionId = fields?.polarSubscriptionId?.stringValue;
  const productId = fields?.polarProductId?.stringValue;
  if (!customerId || !subscriptionId || !productId) return null;

  const status = fields?.status?.stringValue;
  return {
    tier:
      fields?.tier?.stringValue === "plus" || fields?.tier?.stringValue === "pro"
        ? fields.tier.stringValue
        : "free",
    status:
      status === "canceled" ||
      status === "past_due" ||
      status === "trialing" ||
      status === "unpaid"
        ? status
        : "active",
    polarSubscriptionId: subscriptionId,
    polarCustomerId: customerId,
    polarProductId: productId,
    updatedAt: Number(fields?.updatedAt?.integerValue ?? 0),
  };
}

async function reconcileSubscription(
  uid: string,
  idToken: string,
  storedSubscription: Subscription | null,
): Promise<Subscription | null> {
  if (!process.env.POLAR_ACCESS_TOKEN) return storedSubscription;

  const activeSubscriptions = await findActivePolarSubscriptions(uid);
  const polarSubscription = selectPreferredSubscription(activeSubscriptions);
  if (!polarSubscription) return storedSubscription;

  const subscription = toAppSubscription(polarSubscription);
  const isDifferent =
    !storedSubscription ||
    storedSubscription.polarSubscriptionId !== subscription.polarSubscriptionId ||
    storedSubscription.polarProductId !== subscription.polarProductId ||
    storedSubscription.status !== subscription.status;

  if (isDifferent) {
    await writeSubscription(uid, idToken, subscription);
  }

  return subscription;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  try {
    const [storedSubscription, promptUsage] = await Promise.all([
      getStoredSubscription(auth.uid, auth.idToken),
      getPromptUsage(auth.uid, auth.idToken),
    ]);

    // Polar is the billing source of truth. Reconcile on every billing-page
    // load so stale/missing Firestore data cannot show the wrong tier or send
    // a paid customer through a second checkout.
    const subscription = await reconcileSubscription(
      auth.uid,
      auth.idToken,
      storedSubscription,
    );

    if (!subscription || subscription.tier === "free") {
      return NextResponse.json({
        plan: "free",
        status: "active",
        subscription: null,
        orders: [],
        portalUrl: null,
        promptUsage,
      });
    }

    if (!process.env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Billing provider is not configured", promptUsage },
        { status: 503 },
      );
    }

    const session = await polar.customerSessions.create({
      customerId: subscription.polarCustomerId,
      returnUrl: `${SITE_URL}/settings?tab=billing`,
    });

    const [subscriptionPage, orderPage] = await Promise.all([
      polar.customerPortal.subscriptions.list(
        { customerSession: session.token },
        { page: 1, limit: 10, active: null },
      ),
      polar.customerPortal.orders.list(
        { customerSession: session.token },
        { page: 1, limit: 100 },
      ),
    ]);

    const polarSubscription = subscriptionPage.result.items.find(
      (item) => item.id === subscription.polarSubscriptionId,
    ) ?? subscriptionPage.result.items[0];

    return NextResponse.json({
      plan: subscription.tier,
      status: polarSubscription?.status ?? subscription.status,
      subscription: polarSubscription
        ? {
            currentPeriodEnd: isoDate(polarSubscription.currentPeriodEnd),
            cancelAtPeriodEnd: polarSubscription.cancelAtPeriodEnd,
            amount: polarSubscription.amount,
            currency: polarSubscription.currency,
            interval: polarSubscription.recurringInterval,
          }
        : null,
      orders: orderPage.result.items.map((order) => ({
        id: order.id,
        createdAt: isoDate(order.createdAt),
        description: order.product?.name ?? order.description,
        status: order.status,
        paid: order.paid,
        totalAmount: order.totalAmount,
        currency: order.currency,
        invoiceNumber: order.invoiceNumber,
      })),
      portalUrl: session.customerPortalUrl,
      promptUsage,
    });
  } catch (error) {
    console.error("[billing] Failed to load customer billing data:", error);
    return NextResponse.json(
      { error: "Unable to load billing information right now" },
      { status: 502 },
    );
  }
}
