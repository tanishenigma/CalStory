# Polar.sh Setup — CalStory Billing Integration (Vercel Deployment)

This document provides a step-by-step walkthrough for configuring **Polar.sh** with **CalStory** when deployed directly on **Vercel**.

CalStory uses Next.js 16 (App Router). There is **no self-hosted webserver, Nginx, or Docker container** required — all API routes (including `/api/webhooks/polar` and `/api/checkout`) run serverlessly as Vercel Functions.

---

## Architecture Overview

```
User (Browser) ──> Vercel Edge / App Router ──> Firestore (Database)
                       │          ▲
                       │          │ Webhook Event (subscription.created/updated)
                       ▼          │
                 Polar Checkout ──┘
```

1. User clicks **Get Plus** or **Get Pro** on the CalStory Pricing page.
2. User is redirected to Polar's hosted checkout page (`buy.polar.sh`).
3. Upon payment completion, Polar sends a secure webhook payload to `https://<your-domain>/api/webhooks/polar`.
4. The Vercel Serverless Function validates the signature with `POLAR_WEBHOOK_SECRET` and updates the user's tier in Firestore (`users/{uid}/subscription/active`).

---

## Prerequisites

- A [Polar.sh](https://polar.sh) account
- A [Vercel](https://vercel.com) account with the CalStory repository imported
- A custom domain or Vercel default domain (e.g., `calstory.vercel.app` or `calstory.app`)

---

## Step 1 — Create your Polar organization

1. Log in to [polar.sh](https://polar.sh).
2. Click **Create organization** and name it `CalStory`.
3. Complete identity verification / payout settings if prompted.

---

## Step 2 — Generate an Organization Access Token

1. In your Polar org, navigate to **Settings → Access Tokens**.
2. Click **Generate Token** and label it `calstory-vercel`.
3. Select required scopes:
   - `products:read`
   - `checkouts:write`
   - `subscriptions:read`
   - `subscriptions:write` (required for prorated plan upgrades)
   - `customer_sessions:write`
   - `customer_portal:read`
   - `customer_portal:write` (required for customer-initiated cancellation)
4. Copy the generated token string (`polar_oat_...`). You will add this to Vercel in Step 5.

---

## Step 3 — Create Products & Checkout Links

Navigate to **Polar → Products → New Product** to create two subscription tiers:

### 1. Plus Tier ($7 / month)
- **Name:** CalStory Plus
- **Type:** Subscription
- **Price:** $7.00 / month
- **Description:** Unlimited AI meal logs · Adaptive TDEE · Workout templates

Save the product, then copy its **Product ID** (`prod_...`) from the page URL or product details.

Next, navigate to **Checkout Links → Create Checkout Link**:
- **Label:** `CalStory Plus`
- **Product:** CalStory Plus
- **Success URL:** `https://<your-domain>/dashboard?welcome=1&checkout_id={CHECKOUT_ID}`
- **Return URL:** `https://<your-domain>/pricing`

Save and copy the checkout link (`https://buy.polar.sh/...`).

### 2. Pro Tier ($14 / month)
- **Name:** CalStory Pro
- **Type:** Subscription
- **Price:** $14.00 / month
- **Description:** Plus + data export (CSV/JSON) · Priority support · Early access

Save and copy its **Product ID** (`prod_...`).

Create a Checkout Link for Pro:
- **Label:** `CalStory Pro`
- **Product:** CalStory Pro
- **Success URL:** `https://<your-domain>/dashboard?welcome=1&checkout_id={CHECKOUT_ID}`
- **Return URL:** `https://<your-domain>/pricing`

Save and copy the checkout link (`https://buy.polar.sh/...`).

---

## Step 4 — Register Webhook Endpoint in Polar

1. In Polar, navigate to **Settings → Webhooks → Add Endpoint**.
2. Set the **URL** to your Vercel deployment URL:
   ```
   https://<your-domain>/api/webhooks/polar
   ```
   *(e.g., `https://calstory.app/api/webhooks/polar` or `https://calstory.vercel.app/api/webhooks/polar`)*
3. **Format**: Select **`Raw`** (do *not* select Slack or Discord; our Next.js handler expects standard Raw JSON).
4. **API Version**: Select the **latest date version** in the dropdown (or the default recommended date).
5. **Events to subscribe**:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `order.created`
6. Click **Save**. Polar will display your **Signing Secret** (`whsec_...`).
7. Copy this secret for Vercel configuration.

---

## Step 5 — Configure Environment Variables in Vercel

Since CalStory is hosted directly on Vercel, all environment variables must be configured in your Vercel Project Settings.

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your **CalStory** project.
3. Go to **Settings → Environment Variables**.
4. Add the following keys for **Production**, **Preview**, and **Development**:

| Variable Name | Environment | Value Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | All | `https://calstory.app` (or your Vercel domain) |
| `POLAR_ACCESS_TOKEN` | Production/Preview | Server-side org token (`polar_oat_...`) |
| `POLAR_WEBHOOK_SECRET` | Production/Preview | Signing secret (`whsec_...`) |
| `POLAR_PLUS_PRODUCT_ID` | Production/Preview | Product ID for Plus tier (`prod_...`) |
| `POLAR_PRO_PRODUCT_ID` | Production/Preview | Product ID for Pro tier (`prod_...`) |
| `NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK` | All | Direct checkout URL for Plus |
| `NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK` | All | Direct checkout URL for Pro |

5. **Trigger a Redeploy:**
   Vercel bakes `NEXT_PUBLIC_` environment variables into client-side JS bundles during the build step.
   - Go to **Deployments** in Vercel.
   - Click **⋮** on the latest deployment → **Redeploy**.

---

## Step 6 — Testing & Verification

### Testing Production / Staging on Vercel
1. Visit `https://<your-domain>/pricing`.
2. Click **Get Plus** or **Get Pro**.
3. Verify that you are redirected to the Polar hosted checkout screen.
4. Complete a test transaction using Polar's test payment card (`4242 4242 4242 4242`).
5. You will be redirected back to `/dashboard?welcome=1`.
6. Open **Polar Dashboard → Settings → Webhooks → Endpoint Deliveries**. Verify that the `subscription.created` event returned `200 OK`.
7. Open **Firebase Console → Firestore Database**. Verify `users/{uid}/subscription/active` contains `{ status: "active", tier: "plus" }`.

### Local Development Webhook Testing
To test webhooks on `localhost:3000`:
1. Start local server: `npm run dev`
2. Start a local tunnel:
   ```bash
   npx localtunnel --port 3000
   # or
   ngrok http 3000
   ```
3. Copy the tunnel URL (e.g., `https://random-id.loca.lt`) and register it temporarily as a webhook endpoint in **Polar Sandbox** (`sandbox.polar.sh`).

---

## Environment Variables Reference Checklist

```env
# Canonical App URL
NEXT_PUBLIC_SITE_URL=https://calstory.app

# Server-Side Polar Keys (Vercel Serverless Functions)
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
POLAR_PLUS_PRODUCT_ID=prod_xxxxxxxxxxxxxxxxxxxx
POLAR_PRO_PRODUCT_ID=prod_xxxxxxxxxxxxxxxxxxxx

# Client-Side Checkout Links (Pricing Section CTAs)
NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK=https://buy.polar.sh/xxxxxxxx
NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK=https://buy.polar.sh/xxxxxxxx
```
