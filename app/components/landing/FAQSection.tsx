"use client";

import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Zap, Shield, Brain, TrendingUp } from "lucide-react";

const FAQS: {
  q: string;
  a: ReactNode;
  icon: typeof Brain;
  color: string;
}[] = [
  {
    q: "How does AI meal logging work?",
    a: (
      <>
        <p>
          Tap <strong>“Log with AI”</strong> on the dashboard and describe what
          you ate in plain language — for example, “two eggs, toast, and a
          protein shake” or “a Chipotle bowl with chicken, brown rice, black
          beans, and guac.” The model returns a structured calorie and macro
          breakdown (calories, protein, carbs, fat, and serving size) in roughly
          6–9 seconds.
        </p>
        <p className="mt-3">
          Nothing is committed to your log without your confirmation. Every AI
          suggestion opens a review screen where you can edit any field, swap
          the matched food for a different one, or split the meal across
          multiple items. Saving the meal stores the edited version — the raw AI
          output is discarded.
        </p>
        <p className="mt-3">
          The model also remembers your recent meals. If you ate the same
          breakfast yesterday, the AI log suggests it as a one-tap re-log on the
          second day. Over time, this is what makes logging take under 9 seconds
          per meal on average — about a 5× speedup over typing calories into a
          search box.
        </p>
        <p className="mt-3">
          CalStory uses Google Gemini under the hood. You can use the shared
          quota that ships with the app, or paste your own personal Gemini API
          key in <strong>Settings → AI</strong> to bypass rate limits and keep
          your prompts inside your own Google Cloud project. The key is stored
          encrypted in your browser’s local storage and never sent to any
          CalStory- controlled server.
        </p>
      </>
    ),
    icon: Brain,
    color: "var(--color-primary)",
  },
  {
    q: "How is my TDEE calculated?",
    a: (
      <>
        <p>
          CalStory uses the <strong>Mifflin-St Jeor equation</strong> as the
          starting point. For most adults it predicts resting energy expenditure
          to within ±10%, which is the most accurate of the standard formulas
          (better than Harris-Benedict or Katch-McArdle for people who don’t
          know their lean body mass). The equation is:
          <code className="mx-1">
            10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5 (men) or −161
            (women)
          </code>
          .
        </p>
        <p className="mt-3">
          That gives you your <strong>BMR</strong> — the calories you’d burn in
          a coma. We then multiply by an <strong>activity factor</strong>{" "}
          between 1.4 and 1.75 based on your weekly workout count, daily step
          count, and job activity. The result is your <strong>TDEE</strong> —
          your maintenance calories.
        </p>
        <p className="mt-3">
          Most apps stop there. CalStory doesn’t. As you log weight over the
          next 2–3 weeks, the Progress page plots a 7-day rolling average of
          your weight. If the trend moves in the opposite direction from what
          your TDEE predicted, the app auto-tunes your calorie target in 50 kcal
          increments until the trend matches your goal. This is the same
          calibration approach MacroFactor uses, and it’s the single biggest
          reason people stop hitting plateaus when they switch to a trend-aware
          tracker.
        </p>
        <p className="mt-3">
          You can read the full breakdown in our{" "}
          <a
            href="/blog/best-macro-calculator"
            className="text-primary hover:underline">
            Best Macro Calculator for Lifters
          </a>{" "}
          guide.
        </p>
      </>
    ),
    icon: TrendingUp,
    color: "var(--color-primary)",
  },
  {
    q: "What does the streak counter track?",
    a: (
      <>
        <p>
          Your streak counts{" "}
          <strong>
            consecutive days where you’ve logged at least one meal
          </strong>
          . A day only counts if the meal was saved on that calendar day (not
          backdated) — the timestamp stored on each meal is the source of truth.
          This means logging a meal at 11:55pm Monday still counts toward
          Monday’s streak, but logging a meal Tuesday and marking it “Monday”
          does not.
        </p>
        <p className="mt-3">
          The streak number itself is the single most motivational stat in the
          app, but the <strong>consistency heatmap</strong> on the Progress page
          is the more useful one. It shows the last 16 weeks of logged days as a
          grid — each day is a colored dot (primary green if you logged, neutral
          grey if you didn’t). Streaks feel like streaks; heatmaps reveal
          patterns you’d never notice otherwise, like “I always skip Thursdays”
          or “I had a perfect March, then fell off in April.”
        </p>
        <p className="mt-3">Three rules to keep in mind:</p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-2">
          <li>
            Skipping a day does not reset the streak — you can miss one day and
            still continue.
          </li>
          <li>Missing two consecutive days does reset it back to zero.</li>
          <li>
            If you’re on vacation, you can disable the streak in{" "}
            <strong>Settings → Style</strong>; the counter pauses until you turn
            it back on.
          </li>
        </ol>
        <p className="mt-3">
          The flame icon in the badge is filled with the primary color only on
          days you’ve actually logged — it’s a quick at-a-glance check that
          you’re still on track.
        </p>
      </>
    ),
    icon: Zap,
    color: "var(--color-primary)",
  },
  {
    q: "Is my data stored securely?",
    a: (
      <>
        <p>
          Yes. CalStory is <strong>open source</strong> — every line of the app
          and the API is on{" "}
          <a
            href="https://github.com/tanishenigma/CalStory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            GitHub
          </a>{" "}
          and you can audit the data flow yourself. There is no
          CalStory-controlled server that touches your data. When you sign in,
          your data is read from and written to{" "}
          <strong>your own Firebase project</strong> (or your self-hosted
          Postgres if you’ve configured that path).
        </p>
        <p className="mt-3">That means three concrete things:</p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-2">
          <li>
            Your meals, workouts, weight, and profile are stored in{" "}
            <strong>your Firebase</strong> under{" "}
            <code>users/{`{uid}`}/...</code> paths. The Firestore security rules
            that ship with the repo restrict reads and writes to the
            authenticated user only.
          </li>
          <li>
            Your Gemini API key (if you choose to use one) is stored encrypted
            in your browser’s local storage. It is sent directly to Google’s API
            endpoint from your browser — not to any intermediate server.
          </li>
          <li>
            We don’t run analytics, ad pixels, or third-party tracking. The only
            network calls your browser makes are to Firebase (auth, Firestore,
            optionally Cloud Functions) and to Google’s Gemini endpoint.
          </li>
        </ol>
        <p className="mt-3">
          For a deeper walkthrough, read the{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          and the{" "}
          <a href="/cookies" className="text-primary hover:underline">
            Cookie Policy
          </a>
          .
        </p>
      </>
    ),
    icon: Shield,
    color: "var(--color-primary)",
  },
  {
    q: "Is CalStory free?",
    a: (
      <>
        <p>
          Yes — every feature in CalStory is free, with no usage caps on the
          core flow (logging, macro tracking, workout logging, progress
          dashboard, streak tracking). There is no premium tier, no “Pro” plan,
          and no ad-supported variant.
        </p>
        <p className="mt-3">
          The only feature with a soft limit is the{" "}
          <strong>AI food logging</strong>: the shared Gemini quota that ships
          with the app is enough for roughly 30–50 AI logs per day per user,
          which covers most people’s usage. If you log more than that — or if
          you want your prompts to stay inside your own Google Cloud project —
          paste your personal Gemini API key into <strong>Settings → AI</strong>
          . The shared quota is bypassed the moment a personal key is present,
          and your usage is billed directly to your Google account.
        </p>
        <p className="mt-3">
          The repo is open source under a permissive license, so you can
          self-host the entire stack for free. The{" "}
          <a
            href="https://github.com/tanishenigma/CalStory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            GitHub README
          </a>{" "}
          has step-by-step instructions for running on Vercel + Firebase’s free
          Spark plan, which is enough for personal use indefinitely.
        </p>
      </>
    ),
    icon: Brain,
    color: "var(--color-primary)",
  },
];

/* ── Animated character-by-character text reveal ── */
function AnimatedText({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 12, filter: "blur(4px)" }
          }
          transition={{
            duration: 0.35,
            delay: delay + i * 0.018,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          style={{
            display: "inline-block",
            whiteSpace: char === " " ? "pre" : "normal",
          }}>
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Word-by-word reveal for subtitle ── */
function AnimatedWords({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.06,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}>
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── FAQ Item ── */
function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQS)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="w-full">
      <motion.div
        animate={
          isOpen
            ? {
                borderColor: "oklch(0.7227 0.1920 149.5793 / 0.4)",
              }
            : {
                borderColor: "var(--color-border)",
                boxShadow: "0 0 0 0px rgba(34, 197, 94, 0)",
              }
        }
        transition={{ duration: 0.3 }}
        className="rounded-2xl border bg-card overflow-hidden">
        {/* Question row */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          /* Tighter gap (3) on phones, 4 on sm+. The icon and toggle
           * are fixed-width so flex-1 question text gets the rest.
           * min-w-0 on the question span lets it shrink and wrap on
           * narrow viewports instead of pushing the toggle off-screen. */
          className="w-full text-left px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 cursor-pointer group">
          {/* Icon badge */}
          <motion.div
            animate={
              isOpen
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "#fff",
                    scale: 1.08,
                  }
                : {
                    backgroundColor: "var(--color-subtle, #fafaf8)",
                    color: "var(--color-foreground)",
                    scale: 1,
                  }
            }
            transition={{ duration: 0.25 }}
            className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center">
            <Icon size={15} className="sm:hidden" />
            <Icon size={16} className="hidden sm:block" />
          </motion.div>

          {/* Question text */}
          <span className="flex-1 min-w-0 font-bold text-sm sm:text-base text-foreground tracking-tight break-words">
            {item.q}
          </span>

          {/* Toggle icon */}
          <motion.div
            animate={{
              rotate: isOpen ? 45 : 0,
              // Use rgba(0,0,0,0) — not "transparent" — because framer-motion
              // can't interpolate to/from the CSS keyword "transparent",
              // and CSS variables can't be color-tweened either. Both
              // endpoints of an animated color must be numeric RGBA values.
              backgroundColor: isOpen
                ? "var(--color-primary)"
                : "rgba(0, 0, 0, 0)",
            }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center">
            <Plus
              size={14}
              className="text-muted-foreground"
              style={{ color: isOpen ? "#fff" : undefined }}
            />
          </motion.div>
        </button>

        {/* Answer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="overflow-hidden">
              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-5 sm:mx-6 h-px bg-border origin-left"
              />
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -4, opacity: 0 }}
                transition={{ duration: 0.28, delay: 0.08 }}
                /* Scoped prose styles so the multi-paragraph FAQ
                 * answers (which use <p>, <ol>, <code>, <a>)
                 * render with the right spacing, monospace inline
                 * code, and underline-on-hover links. We can't
                 * reach for the global `prose` plugin here because
                 * the FAQ card already owns its visual treatment
                 * (white card, border, rounded-2xl). The subset
                 * below matches the rest of the FAQ card. */
                className="px-5 sm:px-6 pt-4 pb-5 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed
                  [&_p]:mb-3 [&_p:last-child]:mb-0
                  [&_p]:break-words
                  [&_strong]:text-foreground [&_strong]:font-semibold
                  [&_a]:text-primary [&_a:hover]:underline [&_a]:break-words
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3
                  [&_li]:my-0
                  /* Inline <code> blocks in the TDEE answer are
                   * long (~70 chars). Allow them to wrap across
                   * lines on phones narrower than ~380px so the
                   * formula never overflows the card. break-words
                   * is the modern Tailwind alias for overflow-wrap:
                   * break-word. */
                  [&_code]:font-mono [&_code]:text-[11px] [&_code]:sm:text-xs [&_code]:bg-foreground/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:break-words [&_code]:[overflow-wrap:anywhere]
                  [&_em]:text-foreground/80 [&_em]:not-italic">
                {item.a}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Floating decoration ── */
function FloatingDot({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-primary/30 pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{
        duration: 3 + delay,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, amount: 0.5 });

  return (
    <section
      id="faq"
      /* px-4 on phones (16px gutters), 6 on sm+ (24px). Was px-2
       * (8px) which felt claustrophobic on the smallest phones and
       * let the long "Frequently Asked Questions" title crowd the
       * screen edges. */
      className="flex flex-col items-center text-center px-4 sm:px-6 relative">
      {/* Floating decorative dots */}
      <FloatingDot x="5%" y="10%" delay={0} />
      <FloatingDot x="92%" y="25%" delay={1.2} />
      <FloatingDot x="8%" y="70%" delay={0.7} />
      <FloatingDot x="95%" y="75%" delay={1.8} />

      {/* Section header */}
      <div ref={titleRef} className="mb-10">
        {/* Eyebrow badge */}

        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight font-heading text-foreground block">
          <AnimatedText text="Frequently Asked" delay={0.05} />{" "}
          <AnimatedText
            text="Questions"
            className="text-primary"
            delay={0.42}
          />
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
          <AnimatedWords
            text="Everything you need to know about CalStory's AI-powered nutrition tracking."
            delay={0.65}
          />
        </motion.p>
      </div>

      {/* FAQ list — max-w-3xl keeps the cards readable on tablet+
       * (the longest answer is ~3 paragraphs); on phones the cards
       * are full-bleed within the section padding. */}
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {FAQS.map((item, i) => (
          <FAQItem
            key={item.q}
            item={item}
            index={i}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}
