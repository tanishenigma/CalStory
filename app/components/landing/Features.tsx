"use client";

import React, { forwardRef, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";

const features = [
  {
    title: "Log meals in seconds with AI",
    description:
      'CalStory turns "I had two eggs, toast, and a protein shake" into a saved entry in under five seconds. Our AI food logger understands plain English then estimates calories and macros against a nutrition database. You confirm before anything is committed, so the numbers stay yours — not the model\'s.',
    image: "/landing/log-meals.webp",
  },
  {
    title: "Hit your macros without spreadsheets",
    description:
      "Calorie targets, protein floors, and macro splits update in real time as you log. The calorie ring on the dashboard shows what's left for the day; macro pills show whether you're ahead or behind on protein, carbs, and fat. No mental math, no forgotten cells in a Google Sheet.",
    image: "/landing/hit-macros.webp",
  },
  {
    title: "Track every set, every workout",
    description:
      "Strength sessions, HIIT, cardio, yoga, sports — CalStory's schema-driven workout form logs sets, reps, and weight for resistance work, distance and pace for cardio, and duration for everything else. Save workouts as templates and re-log them with one tap.",
    image: "/landing/tack-every-set.webp",
  },
  {
    title: "See real progress, not just numbers",
    description:
      "The Progress page turns your logs into a 16-week consistency heatmap, a calorie-vs-TDEE chart, weekly energy averages, and weight-trend tracking. Spot patterns. Catch stalls. Adjust before frustration sets in.",
    image: "/landing/real-progress.webp",
  },
  {
    title: "Built for lifters, runners, and everyone in between",
    description:
      "CalStory is opinionated about strength training — but the tracking model is generic enough to work for runners logging mileage, cyclists tracking TSS, or anyone who wants to know whether they ate enough protein this week. The TDEE calculator uses the Mifflin-St Jeor equation and refines its estimate as you log weight over time.",
    image: "/landing/built-for-lifters.webp",
  },
];

// One easing, one duration scale, used everywhere. Consistency > novelty.
const EASE = [0.16, 1, 0.3, 1] as const;

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

const reducedVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

function FeatureRow({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isEven = index % 2 === 0;
  const ordinal = String(index + 1).padStart(2, "0");

  const isInView = useInView(rowRef, {
    once: true,
    margin: "-15% 0px -15% 0px",
  });

  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [28, -28]);
  const imageY = useTransform(scrollYProgress, [0, 1], [-28, 28]);

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.12]);

  const variants = shouldReduceMotion ? reducedVariant : rowVariants;

  return (
    <motion.div
      ref={rowRef}
      variants={variants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${
        isEven ? "" : "md:flex-row-reverse"
      }`}>
      {/* Text — parallax-translated by the row's scroll progress.
       * When reduced-motion is on we pass a no-op motion value
       * (identity transform) so the layout is identical but no
       * scroll work happens. */}
      <ParallaxText y={shouldReduceMotion ? undefined : textY}>
        <div className="flex-1 space-y-5">
          <span className="flex items-center gap-3 text-xs font-mono tracking-[0.2em] uppercase text-primary/70">
            <span>{ordinal}</span>
            <span className="block h-px w-8 bg-primary/30" aria-hidden="true" />
            <span className="text-muted-foreground/60">Feature</span>
          </span>

          <h3 className="text-2xl md:text-3xl lg:text-[2.15rem] font-bold text-foreground leading-[1.15] tracking-[-0.02em] font-heading">
            {feature.title}
          </h3>

          <p className="text-muted-foreground leading-[1.75] text-base max-w-[44ch]">
            {feature.description}
          </p>
        </div>
      </ParallaxText>

      {/* Image — opposite-direction Y translate + slight scale. The
       * outer <div> has overflow-hidden + rounded-xl so the
       * translate-y on the inner <motion.div> is visually clipped,
       * which is what gives the "the photo is in a window"
       * parallax look instead of the image sliding out of the
       * frame. */}
      <div className="flex-1 w-full relative aspect-4/3 rounded-xl overflow-hidden">
        <motion.div
          style={{
            y: imageY,
            scale: imageScale,
            width: "100%",
            height: "100%",
            position: "relative",
          }}>
          <Image
            src={feature.image}
            alt={feature.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------
 * ParallaxText
 *
 * Tiny wrapper that applies a scroll-linked Y translate to its
 * children. Passing `y={undefined}` (reduced-motion) renders a plain
 * div so the row's layout is unchanged.
 *
 * The wrapper has no opacity, no scale, no other transform — just
 * the Y translate — because we're layering the entrance variant
 * (`opacity`/`y`) on the *parent* row. Composing two Y transforms
 * via nested motion divs would lose the entrance animation, so the
 * entrance plays once (in-view trigger) and the parallax plays
 * continuously (scroll-linked). They're independent transforms on
 * independent elements.
 * ------------------------------------------------------------------ */
function ParallaxText({
  children,
  y,
}: {
  children: React.ReactNode;
  y: MotionValue<number> | undefined;
}) {
  if (!y) {
    // Reduced-motion path: render the children directly. This keeps
    // the DOM identical to the pre-parallax layout and avoids any
    // transform-related compositing work.
    return <>{children}</>;
  }
  return (
    <motion.div style={{ y, willChange: "transform" }} className="flex-1">
      {children}
    </motion.div>
  );
}

const FeatureGrid = forwardRef<HTMLElement>(function FeatureGrid(_props, ref) {
  return (
    <section
      ref={ref}
      id="features"
      aria-labelledby="seo-content"
      className="relative z-10 py-24 px-6 w-full flex justify-center scroll-mt-24">
      <div className="max-w-6xl mx-auto w-full">
        <h2 id="seo-content" className="sr-only">
          Why CalStory is the best calorie and macro tracker
        </h2>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureRow key={index} feature={feature} index={index} />
          ))}
        </div>

        <div className="max-w-xl mx-auto text-center mt-28">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Want a deeper walkthrough? Read our guides on{" "}
            <Link
              href="/blog/calorie-tracking-for-beginners"
              className="text-primary hover:underline font-medium underline-offset-4">
              calorie tracking for beginners
            </Link>{" "}
            and{" "}
            <Link
              href="/blog/best-macro-calculator"
              className="text-primary hover:underline font-medium underline-offset-4">
              choosing the best macro calculator for lifters
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
});

export default FeatureGrid;
