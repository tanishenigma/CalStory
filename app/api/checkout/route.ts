// app/api/checkout/route.ts
//
// Polar.sh checkout redirect handler.
// Reads `priceId` from the query string and redirects the user to a
// Polar-hosted checkout session.
//
// Setup required (see docs/polar-setup.md):
//   POLAR_ACCESS_TOKEN       — org access token from Polar dashboard
//   NEXT_PUBLIC_SITE_URL     — canonical app URL (already in .env)
//
// Local testing: set server: "sandbox" in the Polar client below
// and use the sandbox priceIds from your Polar sandbox org.

import { type NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  // Switch to "sandbox" for local testing once you have a sandbox org
  server: "production",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://calstory.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const priceId = searchParams.get("priceId");

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

  // ── Guard: priceId required ────────────────────────────────────────
  if (!priceId) {
    return NextResponse.json(
      { error: "priceId query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const checkout = await polar.checkouts.create({
      products: [priceId],
      successUrl: `${SITE_URL}/dashboard?welcome=1&checkout_id={CHECKOUT_ID}`,
    });

    return NextResponse.redirect(checkout.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[polar/checkout] Error creating checkout session:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: message },
      { status: 500 },
    );
  }
}
