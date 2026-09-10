import type { Subscription } from "@/app/types";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Writes a subscription using the caller's Firebase ID token so Firestore
 * security rules evaluate the request as that user.
 */
export async function writeSubscription(
  uid: string,
  idToken: string,
  subscription: Subscription,
): Promise<void> {
  const response = await fetch(
    `${FIRESTORE_BASE}/users/${encodeURIComponent(uid)}/subscription/active`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          tier: { stringValue: subscription.tier },
          status: { stringValue: subscription.status },
          polarSubscriptionId: {
            stringValue: subscription.polarSubscriptionId,
          },
          polarCustomerId: { stringValue: subscription.polarCustomerId },
          polarProductId: { stringValue: subscription.polarProductId },
          updatedAt: { integerValue: String(subscription.updatedAt) },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore subscription write failed (${response.status})`);
  }
}
