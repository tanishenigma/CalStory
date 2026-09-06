# CalStory

A modern fitness & nutrition tracker built with Next.js 16 (App Router), Firebase, and Gemini AI. Hosted directly on **Vercel** serverlessly.

---

## Features

- **Dashboard** — daily calorie ring, macro bars, and a 7-day streak summary
- **Nutrition page** — log meals via food search, manual entry, or AI chat
  - **AI Log Food** — describe a meal in natural language; Gemini estimates macros. Confirm to persist to Firestore, or click Edit to refine.
- **Workouts** — log exercises with sets × reps × weight; save templates
- **Progress** — weight log with trend chart
- **Settings** — profile, calorie targets, TDEE recalculation
- **Pricing** — Free / Plus / Pro tiers powered by Polar.sh

---

## Getting Started (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works locally without any paid integrations — AI and billing degrade gracefully when not configured.

---

## Environment Variables

Copy `.env` to `.env.local` for local overrides. Fill in values for the services you want to enable.

### 1. Firebase (Required)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API key from Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project>.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID from Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web App ID from Firebase Console |

### 2. AI & Third-Party APIs (Optional)

| Variable | Side | Description |
|---|---|---|
| `GEMINI_API_KEY` | Server | Google AI Studio key. Get one at [aistudio.google.com](https://aistudio.google.com). |
| `GEMINI_KEY_ENCRYPTION_SECRET` | Server | 64-char hex secret to encrypt user keys (`openssl rand -hex 32`). |
| `NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID` | Client | OAuth client ID from Google Cloud Console for Fitness API. |
| `EDAMAM_APP_ID` | Server | App ID from [developer.edamam.com](https://developer.edamam.com). |
| `EDAMAM_APP_KEY` | Server | App key from Edamam dashboard. |

### 3. Polar.sh Billing (Optional)

Detailed setup guide: [`docs/polar-setup.md`](docs/polar-setup.md)

| Variable | Side | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Client/Server | Canonical app domain (e.g. `https://calstory.app`) |
| `POLAR_ACCESS_TOKEN` | Server | Org access token — Settings → Access Tokens in Polar |
| `POLAR_WEBHOOK_SECRET` | Server | Signing secret for webhook validation |
| `POLAR_PLUS_PRODUCT_ID` | Server | Product ID for the Plus plan |
| `POLAR_PRO_PRODUCT_ID` | Server | Product ID for the Pro plan |
| `NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK` | Client | Direct checkout link for the Plus CTA |
| `NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK` | Client | Direct checkout link for the Pro CTA |

#### How to get the Polar Checkout Links

The `NEXT_PUBLIC_POLAR_*_CHECKOUT_LINK` variables use **Checkout Links** generated in Polar:

1. Log in to [polar.sh](https://polar.sh) → navigate to **Checkout Links** in the sidebar.
2. Click **＋ (Create Checkout Link)**.
3. Fill in the parameters:
   - **Label:** `CalStory Plus` (internal reference)
   - **Products:** Select `CalStory Plus`
   - **Success URL:** `https://<your-domain>/dashboard?welcome=1&checkout_id={CHECKOUT_ID}`
   - **Return URL:** `https://<your-domain>/pricing`
4. Click **Save** and copy the generated link (e.g. `https://buy.polar.sh/xxxxxxxx`).
5. Repeat for `CalStory Pro` → set as `NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK`.

---

## Project Structure

```
app/
  (app)/              Authenticated route group (dashboard, nutrition, workouts, …)
  pricing/            Standalone /pricing page
  api/
    ai-log-food/      Gemini food logging endpoint
    ai-log-workout/   Gemini workout logging endpoint
    checkout/         Polar checkout redirect session creator
    webhooks/polar/   Polar webhook handler (syncs subscription tier to Firestore)
  components/
    landing/          Landing page components (Navbar, PricingSection, …)
  context/            AppContext — single source of truth for app data
  lib/
    db.ts             Firestore read/write helpers
    firebase.ts       Firebase client singleton
  store/              Zustand stores (auth, prefs)
  types.ts            All shared TypeScript types
docs/
  polar-setup.md      Vercel + Polar.sh billing integration setup guide
```

---

## Deployment (Vercel)

CalStory is designed to deploy seamlessly to **Vercel** with zero custom webserver or infrastructure configuration. Next.js App Router static pages, dynamic client routes, and serverless API endpoints work out-of-the-box.

### 1. Connect Repository to Vercel

1. Push your code to GitHub / GitLab / Bitbucket.
2. Log in to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New → Project**.
3. Import your `CalStory` repository.
4. Select Framework Preset: **Next.js** (Vercel automatically detects Next.js 16 settings).

### 2. Configure Environment Variables in Vercel

Before deploying, expand the **Environment Variables** section in the Vercel project setup wizard (or go to **Project Settings → Environment Variables**):

Add all required values:
- `NEXT_PUBLIC_FIREBASE_*` (Firebase configuration)
- `GEMINI_API_KEY` (AI logging)
- `NEXT_PUBLIC_SITE_URL` (e.g., `https://calstory.app`)
- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PLUS_PRODUCT_ID`, `POLAR_PRO_PRODUCT_ID`
- `NEXT_PUBLIC_POLAR_PLUS_CHECKOUT_LINK`, `NEXT_PUBLIC_POLAR_PRO_CHECKOUT_LINK`

> ⚠️ **Important:** Whenever you add or update `NEXT_PUBLIC_*` variables in Vercel, you **must trigger a redeploy** (**Deployments → ⋮ → Redeploy**) so the build process can bake the values into the client-side JavaScript bundle.

### 3. Deploy & Configure Domain / Webhook

1. Click **Deploy**. Vercel will build and host the application globally on Vercel's Edge Network.
2. In your domain settings or Vercel dashboard, assign your custom domain (e.g. `calstory.app`).
3. In **Polar Dashboard → Settings → Webhooks**, set the webhook endpoint URL to:
   ```
   https://<your-domain>/api/webhooks/polar
   ```
4. Verify that webhooks trigger successfully upon subscription purchase and update Firestore records.
