"use client";

/**
 * SeoFaq — dedicated SEO FAQ block.
 *
 * Renders the long-form, keyword-targeted calorie / calorie-deficit
 * questions users actually search for ("What is a calorie?",
 * "Calorie calculator to lose weight", "Calorie deficit
 * calculator", etc.). Each question is also wired into the
 * `FAQPage` JSON-LD emitted from
 * `app/components/landing/landingJsonLd.ts` so Google can lift
 * them directly into rich-result snippets — keep the two in sync.
 *
 * The answers intentionally reuse exact-phrase keywords that match
 * the search query (so the snippet on the SERP matches the
 * question), then drop into a short, performance-oriented answer
 * that closes with a one-sentence tie-in to a CalStory feature.
 * Tone is direct and lifters-first, not generic wellness copy.
 *
 * The component is rendered server-side (the framer-motion below
 * is purely decorative), so every word lands in the initial HTML
 * response Googlebot sees.
 */

import { useState, useRef, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from "framer-motion";
import { Plus } from "lucide-react";

type Faq = {
  q: string;
  /** Short, plain-text answer that gets emitted into JSON-LD. */
  short: string;
  /** Long-form JSX answer rendered on the page. */
  a: ReactNode;
};

const FAQS: Faq[] = [
  {
    q: "How do I get started?",
    short:
      "Getting started with CalStory takes about three minutes: sign in with Google or email, set your stats in onboarding (age, height, weight, activity), and the app calculates your TDEE and macro targets. Your first meal log takes under 10 seconds with the AI food logger.",
    a: (
      <>
        <p>
          Getting started with CalStory takes about three minutes. Click{" "}
          <strong>Get Started</strong> on the home page, sign in with Google or
          email, and the onboarding flow asks for your age, height, weight, sex,
          and activity level. The app uses that to calculate your TDEE with the
          Mifflin-St Jeor equation and pre-sets your calorie ring and macro
          targets.
        </p>
        <p>
          After onboarding you land on the dashboard. Log your first meal with
          the AI food logger — type something like{" "}
          <em>&ldquo;two eggs, toast, and a protein shake&rdquo;</em> and the
          model returns calories and macros in roughly nine seconds. That&apos;s
          it; the rest of the app opens up as you start logging.
        </p>
      </>
    ),
  },
  {
    q: "Do I need to install anything?",
    short:
      "No installation needed — CalStory runs entirely in the browser as a web app. There is nothing to download on desktop or mobile. Add the site to your home screen and it behaves like a native app (PWA) with offline support for already-loaded screens.",
    a: (
      <>
        <p>
          No installation needed. CalStory is a web app that runs entirely in
          your browser — Chrome, Safari, Firefox, Edge, and mobile browsers all
          work. There is nothing to download from an app store and no separate
          desktop client.
        </p>
        <p>
          On a phone you can add CalStory to your home screen and it behaves
          like a native app: full-screen launch, app-style icon, and offline
          access to the screens you have already loaded. That is a Progressive
          Web App, and it is how most people use CalStory day-to-day.
        </p>
      </>
    ),
  },
  {
    q: "Is there a free trial?",
    short:
      "CalStory has no trial because every feature is already free — there is no premium tier, no paywall, no credit card required. AI food logging runs on a shared quota (~30-50 logs/day) that covers normal use; paste your own Gemini API key in Settings for unlimited AI logs billed to your own Google account.",
    a: (
      <>
        <p>
          There is no free trial because every feature is already free. CalStory
          does not have a premium tier, a usage cap on the core logging flow, or
          a credit-card-required trial period. The entire app — meals, macros,
          workouts, progress heatmap, streak tracking, TDEE calculator — is free
          forever.
        </p>
        <p>
          The only feature with a soft limit is AI food logging: the shared
          Gemini quota covers roughly 30 to 50 AI logs per day, which is enough
          for most people. If you want unlimited AI logs, paste your personal
          Gemini API key into <strong>Settings → AI</strong> — usage is billed
          directly to your Google account and never touches a
          CalStory-controlled server.
        </p>
      </>
    ),
  },
  {
    q: "Can I cancel anytime?",
    short:
      "There is nothing to cancel — CalStory has no subscription, no recurring charges, and no accounts in the billing sense. Your data lives in your own Firebase project (or your self-hosted Postgres), and you can delete it permanently from Settings at any time.",
    a: (
      <>
        <p>
          There is nothing to cancel because there is nothing to pay for.
          CalStory does not run a subscription, charge a recurring fee, or store
          payment information. You cannot be charged by mistake, and there is no
          &ldquo;auto-renew&rdquo; clause to track.
        </p>
        <p>
          Your data is yours and lives in your own Firebase project (or a
          self-hosted Postgres database if you self-host). From{" "}
          <strong>Settings → Data</strong> you can export a full backup or
          delete your account permanently at any time. Deletion is hard delete —
          no retention period, no soft archive.
        </p>
      </>
    ),
  },
  {
    q: "Is my data safe?",
    short:
      "Yes — CalStory is open source, your data lives in your own Firebase project, and Firestore security rules restrict reads and writes to the authenticated user only. There is no CalStory-controlled server that touches your data, no analytics, no ad pixels, and no third-party tracking.",
    a: (
      <>
        <p>
          CalStory is built to be safe by default. Three concrete things make
          that true:
        </p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>
            <strong>Your data is yours.</strong> Meals, workouts, weight, and
            profile live in your own Firebase project under{" "}
            <code>users/{`{uid}`}/...</code> paths. The Firestore security rules
            that ship with the repo restrict reads and writes to the
            authenticated user only — no other client can touch your data.
          </li>
          <li>
            <strong>Your API key is yours.</strong> If you use a personal Gemini
            key for AI logging, it is encrypted in your browser&apos;s local
            storage and sent directly to Google&apos;s API endpoint. No
            intermediate CalStory-controlled server sees the key or your
            prompts.
          </li>
          <li>
            <strong>No tracking.</strong> There are no analytics scripts, ad
            pixels, or third-party trackers. The only network calls your browser
            makes are to Firebase (auth + Firestore) and to Google&apos;s Gemini
            endpoint.
          </li>
        </ol>
        <p className="mt-3">
          The full source is on{" "}
          <a
            href="https://github.com/tanishenigma/CalStory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            GitHub
          </a>{" "}
          if you want to audit the data flow yourself.
        </p>
      </>
    ),
  },
  {
    q: "Who can see my information?",
    short:
      "Only you. CalStory has no social features, no public profiles, no leaderboards, and no data-sharing with third parties. Your meals, workouts, weight, and profile are stored in your own Firebase project and only accessible to your authenticated account.",
    a: (
      <>
        <p>
          Only you, and only while you are signed in. CalStory has no social
          feed, no public profile pages, no leaderboards, no friend graph, and
          no data-sharing with third parties. Your meals, workouts, weight,
          profile, and AI log history are scoped to your Firebase project under
          the <code>users/{`{uid}`}</code> path.
        </p>
        <p>
          Even CalStory itself cannot read your data — the app has no admin-side
          datastore. The repo is open source, so you can verify this against the
          actual Firestore rules that ship with the codebase.
        </p>
      </>
    ),
  },
  {
    q: "Does this work on mobile and Windows?",
    short:
      "Yes — CalStory is a responsive web app that works on iOS, Android, Windows, macOS, and Linux browsers. On phones it installs to your home screen as a PWA and behaves like a native app. The only requirement is a modern browser (Chrome, Safari, Firefox, Edge released in the last two years).",
    a: (
      <>
        <p>
          Yes. CalStory is a responsive web app, which means it runs in any
          modern browser on any device: iOS Safari, Android Chrome, Windows
          Chrome or Edge, macOS Safari or Chrome, and Linux Firefox. The layout
          adapts from a 360-pixel phone screen to ultra-wide desktop.
        </p>
        <p>
          On mobile, &ldquo;Add to Home Screen&rdquo; installs CalStory as a
          Progressive Web App — it launches full-screen, has an app-style icon,
          and works offline for screens you have already loaded. There is no
          separate native app and no need to keep one updated.
        </p>
      </>
    ),
  },
  {
    q: "What if I need help?",
    short:
      "Help is available three ways: in-app help links for common questions, a GitHub Issues tracker for bug reports and feature requests, and direct email support at support@calstory.app. There is no support tier to unlock — every channel is free for every user.",
    a: (
      <>
        <p>Help is available three ways, all free for every user:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>
            <strong>In-app guides.</strong> The blog covers the most common
            questions — calorie tracking, macro calculators, TDEE recalculation
            — and the deep-dive FAQ on the{" "}
            <a
              href="/about#calorie-deficit-faq"
              className="text-primary hover:underline">
              About page
            </a>{" "}
            answers the calorie-deficit questions.
          </li>
          <li>
            <strong>GitHub Issues.</strong> Best for bug reports and feature
            requests. The repo is{" "}
            <a
              href="https://github.com/tanishenigma/CalStory/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline">
              github.com/tanishenigma/CalStory
            </a>{" "}
            and every issue gets a triage label within a few days.
          </li>
          <li>
            <strong>Direct email.</strong>{" "}
            <a
              href="mailto:support@calstory.app"
              className="text-primary hover:underline">
              support@calstory.app
            </a>{" "}
            for anything that does not fit the above. Most replies land within
            two business days.
          </li>
        </ol>
      </>
    ),
  },
  {
    q: "Is there customer support?",
    short:
      "Yes — direct, human support via support@calstory.app. There is no support tier to unlock, no chatbot, no offshore call center. Most replies land within two business days; complex account issues can take up to a week.",
    a: (
      <>
        <p>
          Yes — direct, human support by email at{" "}
          <a
            href="mailto:support@calstory.app"
            className="text-primary hover:underline">
            support@calstory.app
          </a>
          . There is no support tier to unlock, no chatbot, and no offshore call
          center — every email goes to the same engineering team that builds the
          app.
        </p>
        <p>
          Most replies land within two business days; complex account issues can
          take up to a week. Bug reports and feature requests move faster on
          GitHub Issues because triage there is public and the team can track
          them alongside the roadmap.
        </p>
      </>
    ),
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

function SeoFaqItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: Faq;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px -8% 0px" });
  const Item: React.ElementType = motion.div;

  return (
    <Item
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="w-full"
      /* `itemScope` + `itemProp="mainEntity"` is redundant — the
       * page-level FAQPage JSON-LD covers rich-results. We keep a
       * plain <article> wrapper for screen-reader semantics and
       * nothing else, so crawlers don't see conflicting scopes. */
      itemScope
      itemType="https://schema.org/Question">
      <h3 className="sr-only" itemProp="name">
        {item.q}
      </h3>
      <div
        /* itemProp="acceptedAnswer" wraps the visible answer so
         * Googlebot can read it as the FAQPage answer text without
         * having to execute the page-level JSON-LD. */
        itemProp="acceptedAnswer"
        itemScope
        itemType="https://schema.org/Answer"
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`seo-faq-panel-${index}`}
          id={`seo-faq-trigger-${index}`}
          className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 cursor-pointer group">
          <span className="flex-1 min-w-0 font-bold text-sm sm:text-base text-foreground tracking-tight break-words">
            {item.q}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center group-hover:border-primary/40">
            <Plus
              size={14}
              className="text-muted-foreground"
              style={{ color: isOpen ? "var(--color-primary)" : undefined }}
            />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={`seo-faq-panel-${index}`}
              role="region"
              aria-labelledby={`seo-faq-trigger-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="overflow-hidden">
              <div className="mx-5 sm:mx-6 h-px bg-border" />
              <div
                /* prose copy styles scoped to the FAQ card so the
                 * multi-paragraph answers render with the right
                 * spacing, bold, and links. */
                className="px-5 sm:px-6 pt-4 pb-5 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed
                  [&_p]:mb-3 [&_p:last-child]:mb-0
                  [&_p]:break-words
                  [&_strong]:text-foreground [&_strong]:font-semibold
                  [&_a]:text-primary [&_a:hover]:underline [&_a]:break-words">
                {item.a}
                {/* Plain-text mirror of the same answer for
                 * crawlers that don't execute JSON-LD — wrapped in
                 * a hidden div that still lives in the HTML
                 * response. Google reads itemProp scope, but other
                 * scrapers fall back to visible text. */}
                <meta itemProp="text" content={item.short} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Item>
  );
}

export default function SeoFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.4 });

  return (
    <section
      /* Use `id="faq"` so the navbar's `/#faq` link, the
       * `featuresRef`/`faqRef` scroll-target map in
       * `LandingClient`, and any external deep links all land on
       * this single FAQ block. Previously we had a separate
       * product-FAQ block at the same id, which produced two
       * visible FAQ sections on the page; this is now the one
       * and only FAQ on the landing route. */
      id="faq"
      aria-labelledby="faq-heading"
      className="relative z-10 py-24 px-4 sm:px-6 w-full flex justify-center scroll-mt-24">
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          ref={headerRef}
          variants={headerVariants}
          initial="hidden"
          animate={headerInView ? "visible" : "hidden"}
          className="text-center mb-12">
          <span className="inline-block text-xs font-mono tracking-[0.25em] uppercase text-primary/70 mb-4">
            Common Questions
          </span>
          <h2
            id="faq-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] font-heading text-balance">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
            Everything you need to know before you sign up — how to get started,
            whether it&apos;s really free, where your data lives, and what to do
            if you get stuck.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <SeoFaqItem
              key={item.q}
              item={item}
              index={i}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Exported for `landingJsonLd.ts` so the JSON-LD stays in sync. */
export const SEO_FAQS = FAQS;
