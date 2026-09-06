// app/api/webhooks/polar/route.ts
//
// Polar.sh webhook handler.
// Validates the Standard-Webhooks signature, dispatches to per-event
// handlers, and writes the user's subscription tier to Firestore.
//
// Required env vars (see docs/polar-setup.md and .env):
//   POLAR_WEBHOOK_SECRET   — "Signing Secret" from your Polar webhook endpoint
//   POLAR_PLUS_PRODUCT_ID  — Polar product ID for the Plus ($7/mo) plan
//   POLAR_PRO_PRODUCT_ID   — Polar product ID for the Pro ($14/mo) plan
//
// The webhook identifies the Firebase user via the `firebaseUid` key in
// the Polar checkout metadata. When creating a checkout session you must
// pass:
//   metadata: { firebaseUid: "<uid>" }

import { Webhooks } from "@polar-sh/nextjs";
import {
  getSubscription,
  setSubscription,
  clearSubscription,
} from "@/app/lib/db";
import type { SubscriptionTier } from "@/app/types";

// ── Product ID → Tier mapping ───────────────────────────────
// These product IDs come from your Polar dashboard (Products → copy ID).
// Set them in .env so you can swap sandbox / production without code changes.
const PRODUCT_TIER_MAP: Record<string, SubscriptionTier> = {
  ...(process.env.POLAR_PLUS_PRODUCT_ID
    ? { [process.env.POLAR_PLUS_PRODUCT_ID]: "plus" }
    : {}),
  ...(process.env.POLAR_PRO_PRODUCT_ID
    ? { [process.env.POLAR_PRO_PRODUCT_ID]: "pro" }
    : {}),
};

function resolveTier(productId: string): SubscriptionTier {
  return PRODUCT_TIER_MAP[productId] ?? "free";
}

// ── Helpers ─────────────────────────────────────────────────

function extractUid(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;
  const uid = metadata["firebaseUid"];
  return typeof uid === "string" && uid.length > 0 ? uid : null;
}

// ── Webhook export ───────────────────────────────────────────

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",

  // ── subscription.created ────────────────────────────────
  onSubscriptionCreated: async (payload) => {
    const { id, customerId, productId, status, metadata } = payload.data;

    console.log("[polar/webhook] subscription.created", {
      subscriptionId: id,
      customerId,
      productId,
      status,
    });

    const uid = extractUid(metadata as Record<string, unknown> | null);
    if (!uid) {
      console.warn(
        "[polar/webhook] subscription.created: no firebaseUid in metadata — skipping Firestore write",
      );
      return;
    }

    const tier = resolveTier(productId);

    await setSubscription(uid, {
      tier,
      status: status as "active" | "trialing",
      polarSubscriptionId: id,
      polarCustomerId: customerId,
      polarProductId: productId,
      updatedAt: Date.now(),
    });

    console.log(`[polar/webhook] Firestore updated: uid=${uid} tier=${tier}`);
  },

  // ── subscription.updated ────────────────────────────────
  onSubscriptionUpdated: async (payload) => {
    const { id, customerId, productId, status, metadata } = payload.data;

    console.log("[polar/webhook] subscription.updated", {
      subscriptionId: id,
      status,
    });

    const uid = extractUid(metadata as Record<string, unknown> | null);
    if (!uid) {
      // Try to look up the uid via the existing subscription record.
      // This is a best-effort path for webhooks where metadata is stripped.
      console.warn(
        "[polar/webhook] subscription.updated: no firebaseUid in metadata — skipping Firestore write",
      );
      return;
    }

    const tier = resolveTier(productId);
    const normalizedStatus = (
      ["active", "canceled", "past_due", "trialing", "unpaid"].includes(status)
        ? status
        : "active"
    ) as "active" | "canceled" | "past_due" | "trialing" | "unpaid";

    await setSubscription(uid, {
      tier,
      status: normalizedStatus,
      polarSubscriptionId: id,
      polarCustomerId: customerId,
      polarProductId: productId,
      updatedAt: Date.now(),
    });

    console.log(
      `[polar/webhook] Firestore updated: uid=${uid} tier=${tier} status=${status}`,
    );
  },

  // ── subscription.canceled ───────────────────────────────
  onSubscriptionCanceled: async (payload) => {
    const { id, metadata } = payload.data;

    console.log("[polar/webhook] subscription.canceled", {
      subscriptionId: id,
    });

    const uid = extractUid(metadata as Record<string, unknown> | null);
    if (!uid) {
      console.warn(
        "[polar/webhook] subscription.canceled: no firebaseUid in metadata — skipping Firestore write",
      );
      return;
    }

    // Check if there's a newer active subscription before clearing
    const existing = await getSubscription(uid);
    if (existing && existing.polarSubscriptionId !== id) {
      console.log(
        "[polar/webhook] subscription.canceled: user has a different active subscription — skipping clear",
      );
      return;
    }

    await clearSubscription(uid);
    console.log(
      `[polar/webhook] Firestore cleared (downgraded to free): uid=${uid}`,
    );
  },

  // ── order.created ───────────────────────────────────────
  onOrderCreated: async (payload) => {
    console.log("[polar/webhook] order.created", {
      orderId: payload.data.id,
      customerId: payload.data.customerId,
    });

    // No Firestore action for orders — subscription events handle tier changes.
    // Add logic here only if you introduce one-time (non-subscription) products.
  },
});
