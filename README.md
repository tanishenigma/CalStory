# CalStory

A modern fitness & nutrition tracker built with Next.js 16 (App Router), Firebase, and Gemini AI.

## Features

- **Dashboard** — daily calorie ring, macro bars, and a 7-day streak summary
- **Nutrition page** — log meals via FatSecret food search, manual entry, or AI chat
  - **AI Log Food** — describe a meal in natural language; Gemini 1.5 Flash estimates the macros using real-time web search grounding. Confirm to persist directly to Firestore, or click Edit to refine in the manual form.
- **Workouts** — log exercises with sets × reps × weight; save templates
- **Progress** — weight log with trend chart
- **Settings** — profile, calorie targets, TDEE recalculation

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Firebase web app config (all 6 vars) |
| `GEMINI_API_KEY` | For AI food logging | Google AI Studio API key — **server-only, never prefix with `NEXT_PUBLIC_`**. Get one at [aistudio.google.com](https://aistudio.google.com). |

> **Note:** `GEMINI_API_KEY` is used server-side only (`app/api/ai-log-food/route.ts`). Without it the AI chat panel shows a graceful error bubble — the rest of the app works normally.


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
