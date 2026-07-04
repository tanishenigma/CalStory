"use client";

import React, { forwardRef, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
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
      {/* Text — no internal stagger, moves as one unit with the row */}
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

      {/* Image — static, no scroll-linked parallax, no scale */}
      <div className="flex-1 w-full relative aspect-4/3 rounded-xl overflow-hidden">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
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
