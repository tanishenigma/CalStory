/**
 * `/tools/calorie-calculator` — free, no-login daily calorie
 * calculator landing page for CalStory.
 *
 * Server component. Renders the calculator widget (client island)
 * plus original long-form educational content, four reference
 * data tables, and an FAQ block with paired JSON-LD schema.
 *
 * No auth dependency — must render identically for logged-out
 * and logged-in users. No `useApp()`, no `useAuthGuard`.
 *
 * SEO surface
 * ───────────
 *   • Title, description, canonical, OG, Twitter
 *   • Three JSON-LD blocks: WebPage, FAQPage, BreadcrumbList
 *   • Server-rendered initial HTML so Googlebot indexes every
 *     word of the educational copy without executing JS.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import Footer from "@/app/footer";
import { StructuredData } from "@/app/components/seo/StructuredData";
import BlurFade from "@/app/components/animations/BlurFade";
import CalorieCalculator from "./CalorieCalculator";
import EducationalContent from "./EducationalContent";
import ReferenceTables from "./ReferenceTables";
import { ToolPageClient } from "./ToolPageClient";
import { TOOL_FAQS } from "./faqData";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

const TOOL_PATH = "/tools/calorie-calculator";
const TOOL_URL = `${SITE_URL}${TOOL_PATH}`;

export const metadata: Metadata = {
  title: "Calorie Calculator – Free Daily Calorie Needs Estimator | CalStory",
  description:
    "Free daily calorie calculator using Mifflin-St Jeor. Find your maintenance calories plus mild and standard cut/bulk targets in one click. No login required.",
  alternates: { canonical: TOOL_PATH },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  keywords: [
    "daily calorie calculator",
    "calorie calculator",
    "TDEE calculator",
    "how many calories to lose weight",
    "maintenance calorie calculator",
    "BMR calculator",
    "calorie deficit calculator",
    "calorie counter",
    "calorie tracker",
    "calorie needs",
    "weight loss calculator",
    "Mifflin-St Jeor calculator",
    "Harris-Benedict calculator",
    "Katch-McArdle calculator",
  ],
  openGraph: {
    type: "website",
    url: TOOL_URL,
    title: "Calorie Calculator – Free Daily Calorie Needs Estimator | CalStory",
    description:
      "Free daily calorie calculator using Mifflin-St Jeor. Find your maintenance calories plus mild and standard cut/bulk targets in one click.",
    images: [
      {
        url: "/og.png",
        secureUrl: "/og.png",
        width: 1200,
        height: 630,
        alt: "Free Calorie Calculator – Daily Calorie Needs Estimator | CalStory",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Calorie Calculator – Free Daily Calorie Needs Estimator | CalStory",
    description:
      "Free daily calorie calculator using Mifflin-St Jeor. Find your maintenance calories plus mild and standard cut/bulk targets in one click.",
    images: {
      url: "/og.png",
      alt: "Free Calorie Calculator – Daily Calorie Needs Estimator | CalStory",
    },
  },
};

/* ──────────────────────────────────────────────────────────
 * JSON-LD payloads — three distinct schema types emitted in a
 * single <StructuredData data={[...]} /> block.
 * ────────────────────────────────────────────────────────── */

const webpageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${TOOL_URL}#webpage`,
  url: TOOL_URL,
  name: "Calorie Calculator – Free Daily Calorie Needs Estimator",
  description:
    "Free daily calorie calculator using the Mifflin-St Jeor equation. Find your maintenance calories plus mild and standard cut and bulk targets in one click. No login required.",
  inLanguage: "en-US",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "CalStory",
    url: SITE_URL,
  },
  about: [
    { "@type": "Thing", name: "Calories" },
    { "@type": "Thing", name: "Basal Metabolic Rate" },
    { "@type": "Thing", name: "Total Daily Energy Expenditure" },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${TOOL_URL}#faq`,
  url: TOOL_URL,
  name: "Calorie Calculator — FAQ",
  inLanguage: "en-US",
  isPartOf: {
    "@type": "WebPage",
    "@id": `${TOOL_URL}#webpage`,
  },
  mainEntity: TOOL_FAQS.map(({ q, short }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: short },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tools",
      item: `${SITE_URL}/tools`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Calorie Calculator",
      item: TOOL_URL,
    },
  ],
};

/* ──────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────── */

export default function CalorieCalculatorPage() {
  return (
    <>
      <StructuredData data={[webpageJsonLd, faqJsonLd, breadcrumbJsonLd]} />

      <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 forced-dark">
        {/* The Navbar lives inside a thin client wrapper so it can
         * use `useRouter()` for the onSignIn handler — server
         * components can't call `window` / `router.push` directly. */}
        <ToolPageClient>
          <main className="relative z-10 pt-32 pb-24 px-6 w-full flex justify-center">
            <div className="max-w-5xl mx-auto w-full">
              {/* ─── Page header ─────────────────────────── */}
              <BlurFade delay={0.1}>
                <header className="text-center mb-12">
                  <span className="inline-block text-xs font-mono tracking-[0.3em] uppercase text-primary/70 mb-4">
                    Free tool · No login required
                  </span>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] font-heading text-balance mb-6">
                    Calorie Calculator
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Find your daily calorie needs using the Mifflin-St Jeor
                    equation. Get your maintenance calories plus mild and
                    standard cut and bulk targets — instantly, no account
                    required.
                  </p>
                </header>
              </BlurFade>

              {/* ─── Calculator widget (above the fold) ───── */}
              <BlurFade delay={0.15}>
                <CalorieCalculator />
              </BlurFade>

              {/* ─── Educational content (below the fold) ── */}
              <div className="mt-20">
                <EducationalContent />
              </div>

              {/* ─── Reference tables ───────────────────── */}
              <div className="mt-20 pt-12 border-t border-border/40">
                <header className="mb-10">
                  <span className="inline-block text-xs font-mono tracking-[0.25em] uppercase text-primary/70 mb-3">
                    Reference data
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading">
                    Calorie and activity reference tables
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mt-3 max-w-2xl">
                    Common food calories, three sample meal plans, calories
                    burned per hour by activity, and the textbook energy density
                    per gram of macronutrient — all in one place.
                  </p>
                </header>
                <ReferenceTables />
              </div>

              {/* ─── FAQ block ──────────────────────────── */}
              <div className="mt-20 pt-12 border-t border-border/40">
                <header className="mb-8">
                  <span className="inline-block text-xs font-mono tracking-[0.25em] uppercase text-primary/70 mb-3">
                    FAQ
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-heading">
                    Calorie Calculator questions, answered
                  </h2>
                </header>
                <FaqList />
              </div>

              {/* ─── Closing CTA ────────────────────────── */}
              <div className="mt-20 pt-12 border-t border-border/40">
                <div className="rounded-3xl border border-border bg-foreground/[0.02] p-8 md:p-12 text-center">
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight font-heading mb-4 text-balance">
                    One number is just the start.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                    CalStory takes your daily calorie target and tracks every
                    meal, every workout, and every weekly weight entry — then
                    adjusts the target as your body changes. Free forever, no
                    paywalls, no card on file.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-foreground text-background text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-foreground/10">
                    Try CalStory free
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </ToolPageClient>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
 * FAQ list — server-rendered <details>/<summary> block. No
 * client JS; fully crawlable; opens on click.
 * ────────────────────────────────────────────────────────── */

function FaqList() {
  return (
    <div className="space-y-3">
      {TOOL_FAQS.map(({ q, short }) => (
        <details
          key={q}
          className="group rounded-2xl border border-border bg-card overflow-hidden">
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 md:p-6 hover:bg-foreground/[0.02] transition-colors">
            <h3 className="text-base md:text-lg font-bold text-foreground font-heading tracking-tight">
              {q}
            </h3>
            <ChevronDown
              size={18}
              className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-5 md:px-6 pb-5 md:pb-6 text-muted-foreground leading-relaxed">
            {short}
          </div>
        </details>
      ))}
    </div>
  );
}
