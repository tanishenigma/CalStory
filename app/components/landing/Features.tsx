"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
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
    margin: "-18% 0px -40% 0px",
  });

  // Parallax for image
  const { scrollYProgress: imageScroll } = useScroll({
    target: rowRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(imageScroll, [0, 1], ["0%", "-18%"]);

  // Ghost number drift
  const ghostY = useTransform(imageScroll, [0, 1], ["0%", "-10%"]);

  const textX = isEven ? -50 : 50;
  const imageX = isEven ? 50 : -50;

  // Shared transition for reduced motion fallback
  const reducedVariant: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  };

  const textVariants: Variants = shouldReduceMotion
    ? reducedVariant
    : {
        hidden: { x: textX, opacity: 0 },
        visible: {
          x: 0,
          opacity: 1,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
      };

  const imageVariants: Variants = shouldReduceMotion
    ? reducedVariant
    : {
        hidden: { x: imageX, opacity: 0, scale: 0.97 },
        visible: {
          x: 0,
          opacity: 1,
          scale: 1,
          transition: { duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.1 },
        },
      };

  const ghostVariants: Variants = shouldReduceMotion
    ? reducedVariant
    : {
        hidden: { opacity: 0, scale: 0.92 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.15 },
        },
      };

  const eyebrowVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: "easeOut", delay: 0.15 },
    },
  };

  const titleVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.55, ease: "easeOut", delay: 0.35 },
    },
  };

  const descVariants: Variants = {
    hidden: { y: 14, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.55, ease: "easeOut", delay: 0.45 },
    },
  };

  const animate = isInView ? "visible" : "hidden";

  return (
    <div
      ref={rowRef}
      className={`relative flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${
        isEven ? "" : "md:flex-row-reverse"
      }`}>
      <motion.span
        aria-hidden="true"
        variants={ghostVariants}
        initial="hidden"
        animate={animate}
        style={{ y: ghostY }}
        className={`
          hidden md:block pointer-events-none absolute select-none
          font-heading font-black text-[clamp(7rem,18vw,14rem)]
          leading-none text-primary/10
          ${isEven ? "right-[38%] md:right-[46%] -bottom-8" : "left-[38%] md:left-[76%] -bottom-8"}
        `}>
        {ordinal}
      </motion.span>

      {/* Text */}
      <motion.div
        variants={textVariants}
        initial="hidden"
        animate={animate}
        className="flex-1 space-y-5 relative z-10">
        <motion.span
          variants={shouldReduceMotion ? reducedVariant : eyebrowVariants}
          initial="hidden"
          animate={animate}
          className="flex items-center gap-3 text-xs font-mono tracking-[0.2em] uppercase text-primary/70">
          <span>{ordinal}</span>
          <span className="block h-px w-8 bg-primary/30" aria-hidden="true" />
          <span className="text-muted-foreground/60">Feature</span>
        </motion.span>

        <motion.h3
          variants={shouldReduceMotion ? reducedVariant : titleVariants}
          initial="hidden"
          animate={animate}
          className="text-2xl md:text-3xl lg:text-[2.15rem] font-bold text-foreground leading-[1.15] tracking-[-0.02em] font-heading">
          {feature.title}
        </motion.h3>

        <motion.p
          variants={shouldReduceMotion ? reducedVariant : descVariants}
          initial="hidden"
          animate={animate}
          className="text-muted-foreground leading-[1.75] text-base max-w-[44ch]">
          {feature.description}
        </motion.p>
      </motion.div>

      {/* Image */}
      <motion.div
        variants={imageVariants}
        initial="hidden"
        animate={animate}
        style={shouldReduceMotion ? {} : { y: imageY }}
        className="flex-1 w-full relative aspect-4/3 will-change-transform rounded-xl overflow-hidden z-10">
        <Image
          src={feature.image}
          alt={feature.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </motion.div>
    </div>
  );
}

export default function FeatureGrid() {
  const footerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const footerInView = useInView(footerRef, { once: true, margin: "-10% 0px" });

  return (
    <section
      aria-labelledby="seo-content"
      className="relative z-10 py-24 px-6 w-full flex justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <h2 id="seo-content" className="sr-only">
          Why CalStory is the best calorie and macro tracker
        </h2>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureRow key={index} feature={feature} index={index} />
          ))}
        </div>

        <motion.div
          ref={footerRef}
          initial={{ y: 16, opacity: 0 }}
          animate={footerInView ? { y: 0, opacity: 1 } : {}}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut" }
          }
          className="max-w-xl mx-auto text-center mt-28">
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
        </motion.div>
      </div>
    </section>
  );
}
