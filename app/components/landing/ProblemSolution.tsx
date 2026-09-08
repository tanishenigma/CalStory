"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  Gift,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────
 * Content — 4 paired rows: problem ↔ solution.
 * Each pair shares the same theme so the two columns read as
 * a direct before/after comparison.
 * ───────────────────────────────────────────────────────────── */
interface ComparisonItem {
  problem: { title: string; desc: string };
  solution: { icon: React.ElementType; title: string; desc: string };
}

const COMPARISONS: ComparisonItem[] = [
  {
    problem: {
      title: "Static calorie targets that never update",
      desc: "Your needs change as you lose weight. Most apps give you one number and never update it.",
    },
    solution: {
      icon: TrendingUp,
      title: "Adaptive TDEE from your actual weight trend",
      desc: "Your calorie target adjusts weekly from your logged weight trend — automatically.",
    },
  },
  {
    problem: {
      title: "Logs without pattern recognition",
      desc: "Daily numbers hide the patterns — the Sunday overeating, the weeks you drift.",
    },
    solution: {
      icon: Brain,
      title: "16-week heatmap + calorie vs. TDEE chart",
      desc: "Progress views that show consistency and drift, not just today's number.",
    },
  },
  {
    problem: {
      title: "Cardio-first design that ignores strength training",
      desc: "Most trackers treat workouts as a calorie-burn field. No sets, no reps, no progressive overload.",
    },
    solution: {
      icon: Zap,
      title: "Full strength logging built in, not bolted on",
      desc: "Sets, reps, weight, templates — one tap. Strength, cardio, HIIT, yoga, all in one form.",
    },
  },
  {
    problem: {
      title: "Core features gated behind paid tiers",
      desc: "Macros, history, weight graphs — basics locked behind paywalls.",
    },
    solution: {
      icon: Gift,
      title: "Free core features, no paywall games",
      desc: "Macros, history, weight graphs — free forever. No dark patterns, no lock-in.",
    },
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const rowItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

/* ─────────────────────────────────────────────────────────────
 * Cards — problem cards read as neutral/muted (red only on the
 * X icon), solution cards read as the warmer, stronger side.
 * ───────────────────────────────────────────────────────────── */
function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5 p-5 h-full rounded-2xl bg-muted/40 border border-red/15 transition-colors duration-300">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-red/10 flex items-center justify-center">
        <X className="w-4 h-4 text-red" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-sm text-foreground/80 leading-snug">
          {title}
        </h4>
        <p className="mt-1.5 text-sm text-muted-foreground/80 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
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
    <div className="flex items-start gap-3.5 p-5 h-full rounded-2xl bg-primary/[0.05] border border-primary/20 shadow-sm shadow-primary/[0.06] transition-colors duration-300 hover:border-primary/35 hover:shadow-md hover:shadow-primary/10">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-sm text-foreground leading-snug">
          {title}
        </h4>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

/* ── Row:  [Problem Card]  →  [Solution Card] ── */
function ComparisonRow({ item }: { item: ComparisonItem }) {
  return (
    <motion.div
      variants={rowItem}
      className="grid grid-cols-1 md:grid-cols-[1fr_2.75rem_1fr] gap-4 md:gap-0 items-stretch">
      <ProblemCard {...item.problem} />
      {/* Arrow — down on mobile, rightward on desktop */}
      <div
        className="flex items-center justify-center py-1 md:py-0"
        aria-hidden="true">
        <ArrowDown
          className="w-4 h-4 text-primary/60 md:hidden"
          strokeWidth={2.5}
        />
        <ArrowRight
          className="hidden md:block w-4 h-4 text-primary/60"
          strokeWidth={2.5}
        />
      </div>
      <SolutionCard {...item.solution} />
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
      className="relative z-10 py-24 px-6 w-full">
      <div className="max-w-6xl mx-auto">
        {/* ── Intro ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12 md:mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Why CalStory
          </span>
          <h2
            id="ps-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading">
            Built to show you what your <br />
            numbers
            <span className="text-primary"> actually mean</span>.
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Most trackers record your data. CalStory helps you understand it.
          </p>
        </motion.div>

        {/* ── Column labels (desktop) ── */}
        <div className="hidden md:grid grid-cols-[1fr_2.75rem_1fr] mb-4">
          <div className="flex items-center gap-2 pr-6">
            <X className="w-3.5 h-3.5 text-red shrink-0" strokeWidth={2.5} />
            <h3 className="font-semibold text-xs tracking-widest uppercase text-muted-foreground">
              What other trackers get wrong
            </h3>
          </div>
          <div />
          <div className="flex items-center justify-end gap-2 pl-6">
            <h3 className="font-semibold text-xs tracking-widest uppercase text-primary">
              What CalStory fixes
            </h3>
            <Check
              className="w-3.5 h-3.5 text-primary shrink-0"
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* ── Comparison rows ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="space-y-4">
          {COMPARISONS.map((item) => (
            <ComparisonRow key={item.problem.title} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
