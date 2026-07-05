"use client";

/**
 * SeoContent — on-page SEO copy block.
 *
 * Roughly 600 words of keyword-rich, educational prose about the
 * CalStory tool, designed to give Google enough topical depth to
 * rank the landing page for the long-tail queries we care about:
 *   • calorie, calorie calculator, calorie counter, calorie tracker
 *   • calorie deficit, calorie deficit calculator
 *   • maintenance calorie calculator
 *   • what is a calorie, what is a calorie deficit
 *   • best workout apps, workout routines, workout log
 *
 * The prose is split into semantic sections (H2 + H3 + P) so
 * crawlers can pick up the headings directly, and so screen
 * readers can navigate the page outline. Internal links to the
 * blog posts that target the same topics reinforce the topical
 * cluster without competing for the same keyword.
 *
 * The component renders server-side during Next.js SSR (the
 * client-side motion below is purely decorative), so every word
 * is in the initial HTML response Googlebot sees.
 */

import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

function FadeOnView({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  return (
    <motion.div
      ref={ref}
      variants={sectionVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
      custom={delay}>
      {children}
    </motion.div>
  );
}

export default function SeoContent() {
  return (
    <section
      id="about-calstory"
      aria-labelledby="seo-content-heading"
      className="relative z-10 py-24 px-6 w-full flex justify-center scroll-mt-24">
      <div className="max-w-3xl mx-auto w-full">
        <FadeOnView>
          <header className="text-center mb-14">
            {/* `About CalStory` eyebrow is a link to the dedicated
             * /about route (with its own AboutPage JSON-LD) so
             * users who want the company/creator background can
             * navigate to it directly. The h2 below remains a
             * text-only SEO heading because it describes the
             * section, not CalStory-the-company. */}
            <Link
              href="/about"
              aria-label="About CalStory — open the dedicated About page"
              className="inline-flex items-center gap-1.5 text-xs font-mono tracking-[0.25em] uppercase text-primary/70 hover:text-primary mb-4 transition-colors group">
              <span>About CalStory</span>
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
            <h2
              id="seo-content-heading"
              className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] font-heading text-balance">
              Your free <span className="text-primary">calorie tracker</span>,
              calorie counter, and workout log
            </h2>
          </header>
        </FadeOnView>

        <div className="space-y-8 text-muted-foreground text-base md:text-[17px] leading-[1.8]">
          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              What is a calorie?
            </h3>
            <p>
              A calorie is the basic unit of energy your body uses to function.
              Every breath, every heartbeat, and every step you take burns
              calories; every bite of food you eat puts them back. When the
              calories you consume equal the calories you burn, your weight
              stays the same. Eat more than you burn and you gain weight; eat
              less than you burn and you lose weight. That simple equation —
              energy balance — is the foundation of every diet and every fitness
              goal, and it&apos;s the first thing CalStory puts in front of you.
            </p>
          </FadeOnView>

          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              What is a calorie deficit?
            </h3>
            <p>
              A calorie deficit is what happens when you consistently burn more
              calories than you consume. It&apos;s the mechanism behind every
              successful weight-loss plan, and it&apos;s also the most
              misunderstood idea in fitness. A calorie deficit is not
              starvation, not skipping meals, and not punishing yourself with
              hours of cardio. It&apos;s a deliberate reduction in calorie
              intake — usually 300 to 500 calories below your maintenance level
              — that lets you lose fat while preserving muscle and energy.
            </p>
          </FadeOnView>

          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              The calorie calculator and maintenance calorie calculator
            </h3>
            <p>
              CalStory&apos;s calorie calculator uses the Mifflin-St Jeor
              equation — the most accurate of the standard BMR formulas —
              combined with your activity level to estimate your maintenance
              calorie intake. The maintenance calorie calculator then adjusts
              that daily target based on your goal: lose, maintain, or gain.
              Because weight loss rarely follows a straight line, the calorie
              deficit calculator recalibrates your target each week from your
              logged weight, so the math stays accurate as your body changes.
            </p>
          </FadeOnView>

          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              A calorie counter and calorie tracker built for speed
            </h3>
            <p>
              As a calorie counter and calorie tracker, CalStory gives you a
              fast, friction-free way to log every meal and watch your daily
              totals update in real time. The AI food logger turns &ldquo;two
              eggs, toast, and a protein shake&rdquo; into a saved entry in
              under nine seconds; macros and calories appear instantly on the
              dashboard. Nothing is committed without your confirmation, so the
              numbers stay yours — not the model&apos;s. Over time, the calorie
              tracker remembers your recent meals and offers one-tap re-logging
              for anything you eat often.
            </p>
          </FadeOnView>

          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              Workout routines, a workout log, and one of the best workout apps
            </h3>
            <p>
              Tracking alone doesn&apos;t transform a body — training does.
              That&apos;s why CalStory is also one of the{" "}
              <Link
                href="/workouts"
                className="text-primary hover:underline underline-offset-4 font-medium">
                best workout apps
              </Link>{" "}
              for people who want their nutrition and training in the same
              place. The workout log captures every set, rep, and kilogram of
              every strength session, and the schema-driven workout form makes
              it easy to record cardio, HIIT, yoga, sports, or anything else.
              Save your favourite{" "}
              <Link
                href="/blog/workout-routines-for-beginners"
                className="text-primary hover:underline underline-offset-4 font-medium">
                workout routines
              </Link>{" "}
              as templates and re-log them with a single tap; whether you follow
              a push-pull-legs split, a five-by-five strength program, or your
              own hybrid routine, the workout log keeps the history searchable
              and the progress visible.
            </p>
          </FadeOnView>

          <FadeOnView>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-heading tracking-tight">
              Putting it all together
            </h3>
            <p>
              Your calorie tracker shows what you ate; your workout log shows
              what you did; the Progress page shows what changed. A 16-week
              consistency heatmap surfaces patterns you&apos;d never notice on
              your own — the skipped Thursdays, the perfect March, the slump
              after a holiday. Streak tracking adds a small, healthy nudge to
              keep showing up. Whether you&apos;re trying to understand{" "}
              <Link
                href="/blog/calorie-tracking-for-beginners"
                className="text-primary hover:underline underline-offset-4 font-medium">
                what a calorie deficit really is
              </Link>
              , looking for a calorie deficit calculator that adapts as you lose
              weight, searching for a maintenance calorie calculator you can
              trust long-term, or hunting for the best workout apps to pair with
              your nutrition tracking — CalStory is built for the entire
              journey. It&apos;s free, it&apos;s fast, and it&apos;s yours.
            </p>
          </FadeOnView>
        </div>
      </div>
    </section>
  );
}
