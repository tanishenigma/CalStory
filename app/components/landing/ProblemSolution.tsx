"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Dumbbell,
  DollarSign,
  TrendingUp,
  Brain,
  Zap,
  Gift,
  X,
  Check,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────
 * Content — 4 paired rows: problem ↔ solution.
 * Each pair shares the same theme so the two columns read as
 * a direct before/after comparison.
 * ───────────────────────────────────────────────────────────── */
const PROBLEMS = [
  {
    icon: Clock,
    title: "Static calorie targets that never update",
    desc: "Your needs change as you lose weight. Most apps give you one number and never update it.",
  },
  {
    icon: AlertTriangle,
    title: "Logs without pattern recognition",
    desc: "Daily numbers hide the patterns — the Sunday overeating, the weeks you drift.",
  },
  {
    icon: Dumbbell,
    title: "Cardio-first design that ignores strength training",
    desc: "Most trackers treat workouts as a calorie-burn field. No sets, no reps, no progressive overload.",
  },
  {
    icon: DollarSign,
    title: "Core features gated behind paid tiers",
    desc: "Macros, history, weight graphs — basics locked behind paywalls.",
  },
];

const SOLUTIONS = [
  {
    icon: TrendingUp,
    title: "Adaptive TDEE from your actual weight trend",
    desc: "Your calorie target adjusts weekly from your logged weight trend — automatically.",
  },
  {
    icon: Brain,
    title: "16-week heatmap + calorie vs. TDEE chart",
    desc: "Progress views that show consistency and drift, not just today's number.",
  },
  {
    icon: Zap,
    title: "Full strength logging built in, not bolted on",
    desc: "Sets, reps, weight, templates — one tap. Strength, cardio, HIIT, yoga, all in one form.",
  },
  {
    icon: Gift,
    title: "Free core features, no paywall games",
    desc: "Macros, history, weight graphs — free forever. No dark patterns, no lock-in.",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

/* ─────────────────────────────────────────────────────────────
 * Cards — left column reads "bad" (rose tint, muted), right
 * column reads "good" (green tint, full contrast).
 * ───────────────────────────────────────────────────────────── */
function ProblemCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-4 p-5 rounded-2xl bg-red/4 border border-red/10 hover:border-red/25 hover:shadow-lg hover:shadow-red/5 transition-shadow duration-300">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-red/10 flex items-center justify-center">
        <X className="w-4 h-4 text-red" strokeWidth={2.5} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground/50" />
          <h4 className="font-semibold text-sm text-foreground/70">{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

function SolutionCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={cardItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-4 p-5 rounded-2xl bg-primary/[0.07] border border-primary/20 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/10 transition-shadow duration-300">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/15 flex items-center justify-center">
        <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-primary/70" />
          <h4 className="font-bold text-sm text-foreground">{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function ProblemSolution() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      ref={ref}
      id="problem-solution"
      aria-labelledby="ps-heading"
      className="relative z-10 py-16 md:py-32 px-6 w-full">
      <div className="max-w-6xl mx-auto">
        {/* ── Heading block ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12 md:mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            The problem
          </span>
          <h2
            id="ps-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading">
            Most trackers show today&apos;s number.{" "}
            <span className="text-primary">
              CalStory shows the whole story.
            </span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Static targets, daily-number-only views, and paywalled basics.
            Here&apos;s what we fixed.
          </p>
        </motion.div>

        {/* ── Two-column comparison ── */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Vertical divider + VS badge (desktop only) */}
          <div
            className="hidden lg:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 items-center justify-center z-10"
            aria-hidden="true">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
            <div className="relative w-12 h-12 rounded-full bg-card border border-border shadow-md flex items-center justify-center">
              <span className="text-[10px] font-black tracking-widest text-muted-foreground">
                VS
              </span>
            </div>
          </div>

          {/* Left — what other trackers get wrong */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
              className="flex items-center gap-2 mb-6">
              <X className="w-4 h-4 text-red shrink-0" strokeWidth={2.5} />
              <h3 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">
                What other trackers get wrong
              </h3>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="space-y-4">
              {PROBLEMS.map((p) => (
                <ProblemCard key={p.title} {...p} />
              ))}
            </motion.div>
          </div>

          {/* Right — what CalStory fixes */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
              className="flex items-center gap-2 mb-6">
              <Check
                className="w-4 h-4 text-primary shrink-0"
                strokeWidth={2.5}
              />
              <h3 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">
                What CalStory fixes
              </h3>
            </motion.div>

            <motion.div
              variants={container}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="space-y-4">
              {SOLUTIONS.map((s) => (
                <SolutionCard key={s.title} {...s} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
