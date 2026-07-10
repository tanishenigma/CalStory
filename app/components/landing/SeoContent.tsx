"use client";

/**
 * SeoContent — on-page SEO copy block.
 *
 * Keyword-rich, educational prose about the CalStory tool, designed
 * to give Google enough topical depth to rank the landing page for
 * the long-tail queries we care about:
 *   • calorie, calorie calculator, calorie counter, calorie tracker
 *   • calorie deficit, calorie deficit calculator
 *   • maintenance calorie calculator
 *   • what is a calorie, what is a calorie deficit
 *   • best workout apps, workout routines, workout log
 *
 * Each bento card description is kept short (2–3 sentences) on
 * purpose — long enough to carry the target keyword in context, but
 * short enough to sit fully visible in the card at every breakpoint
 * instead of relying on line-clamp truncation. The deeper version of
 * each topic lives on its linked blog post, which is what the
 * internal links below point to.
 *
 * The prose is split into semantic sections (H2 + H3 + P) so
 * crawlers can pick up the headings directly, and so screen
 * readers can navigate the page outline.
 *
 * The component renders server-side during Next.js SSR (the
 * client-side motion below is purely decorative), so every word
 * is in the initial HTML response Googlebot sees.
 */

import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Flame, TrendingDown, Calculator, Timer, Dumbbell, Target } from "lucide-react";
import { BentoGrid, BentoCard } from "@/app/components/ui/bento-grid";

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
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
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
      custom={delay}
      className={className}>
      {children}
    </motion.div>
  );
}

const features = [
  {
    Icon: Flame,
    name: "What is a calorie?",
    description: (
      <p>
        A calorie is the unit of energy your body burns just by
        breathing, moving, and functioning — and the unit you take back
        in with food. Eat more than you burn and you gain weight; eat
        less and you lose it. That energy balance is what CalStory
        tracks first.
      </p>
    ),
    className: "lg:col-span-1",
  },
  {
    Icon: TrendingDown,
    name: "What is a calorie deficit?",
    description: (
      <p>
        A calorie deficit means consistently burning more than you
        consume — the mechanism behind every successful weight-loss
        plan. Done right, it&apos;s a modest 300–500 calorie gap below
        maintenance, not starvation or hours of extra cardio.
      </p>
    ),
    className: "lg:col-span-1",
  },
  {
    Icon: Calculator,
    name: "Calorie & maintenance calorie calculator",
    description: (
      <p>
        Our calorie calculator uses the Mifflin-St Jeor equation, the
        most accurate standard BMR formula, to set your maintenance
        calories. From there it becomes a calorie deficit calculator
        that recalibrates weekly as your logged weight changes.
      </p>
    ),
    className: "lg:col-span-1",
  },
  {
    Icon: Timer,
    name: "A calorie counter built for speed",
    description: (
      <p>
        Describe a meal in plain language and the AI logger turns it
        into a saved calorie and macro entry in under nine seconds —
        nothing commits without your confirmation. It also remembers
        your regulars for one-tap re-logging.
      </p>
    ),
    className: "lg:col-span-1",
  },
  {
    Icon: Dumbbell,
    name: "Workout routines and a workout log",
    description: (
      <p>
        Tracking alone doesn&apos;t change a body — training does. The
        workout log captures every set and rep, and you can save any{" "}
        <Link
          href="/blog/workout-routines-for-beginners"
          className="text-primary hover:underline underline-offset-4 font-medium">
          workout routine
        </Link>{" "}
        as a template to re-log with one tap, whatever split you follow.
      </p>
    ),
    className: "lg:col-span-2",
  },
  {
    Icon: Target,
    name: "Putting it all together",
    description: (
      <p>
        Your tracker shows what you ate, your log shows what you did,
        and Progress shows what changed — a 16-week heatmap surfaces
        patterns like a slump after a holiday. Read more on{" "}
        <Link
          href="/blog/calorie-tracking-for-beginners"
          className="text-primary hover:underline underline-offset-4 font-medium">
          calorie tracking for beginners
        </Link>
        . It&apos;s free, fast, and yours.
      </p>
    ),
    className: "lg:col-span-3",
  },
];

export default function SeoContent() {
  return (
    <section
      id="about-calstory"
      aria-labelledby="seo-content-heading"
      className="relative z-10 py-24 px-6 w-full flex justify-center scroll-mt-24">
      <div className="max-w-5xl mx-auto w-full">
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

        <BentoGrid>
          {features.map((feature, idx) => (
            <FadeOnView key={idx} delay={idx * 0.1} className={feature.className}>
              <BentoCard
                name={feature.name}
                Icon={feature.Icon}
                description={feature.description}
                className="h-full"
              />
            </FadeOnView>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
