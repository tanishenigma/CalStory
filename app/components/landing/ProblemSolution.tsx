"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
import {
  Clock,
  AlertTriangle,
  ShieldOff,
  DollarSign,
  Zap,
  Lock,
  TrendingUp,
  Brain,
  Dumbbell,
  X,
  Check,
} from "lucide-react";

const PROBLEMS = [
  {
    icon: Clock,
    title: "Static calorie targets that never update",
    desc: "You lose 5 kg and your app still tells you to eat the same calories as day one. Most trackers give you a TDEE number once and forget you exist. Your actual needs drift; the target doesn't.",
  },
  {
    icon: AlertTriangle,
    title: "Logs without pattern recognition",
    desc: "You can see today's numbers. You can't see that you consistently go 300 kcal over on Sundays, or that your calorie intake spikes whenever your logged workouts drop. Patterns are invisible in a daily number view.",
  },
  {
    icon: Dumbbell,
    title: "Cardio-first design that ignores strength training",
    desc: "Most food trackers treat workouts as a calorie-burn adjustment field. There's no set-by-set logging, no progressive overload tracking, no workout templates. If you lift, you're using a second app.",
  },
  {
    icon: DollarSign,
    title: "Core features gated behind paid tiers",
    desc: "Macro tracking, full calorie history, detailed weight graphs — things that should be basic are locked. The free tier exists to frustrate you into upgrading, not to actually help you track.",
  },
];

const SOLUTIONS = [
  {
    icon: TrendingUp,
    title: "TDEE that updates from your actual weight trend",
    desc: "CalStory looks at your logged weight every week and adjusts your calorie target to keep you on track. If you're losing faster or slower than planned, the target moves — automatically.",
  },
  {
    icon: Brain,
    title: "16-week heatmap + calorie vs. TDEE chart",
    desc: "The Progress page surfaces patterns you'd never spot in a daily number: consistency trends, calorie drift weeks, weight plateau periods. Built for the kind of review that actually changes behaviour.",
  },
  {
    icon: Zap,
    title: "Full strength logging built in, not bolted on",
    desc: "Sets, reps, weight, rest notes — all in one tap. Save any session as a template and re-log with pre-filled weights from last time. Resistance, cardio, HIIT, yoga — all in one schema-driven form.",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

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
      className="flex items-start gap-4 p-5 rounded-2xl bg-foreground/[0.03] border border-border hover:border-border/80 transition-colors">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-foreground/6 flex items-center justify-center">
        <X className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground/60" />
          <h4 className="font-semibold text-sm text-foreground/80">{title}</h4>
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
      className="flex items-start gap-4 p-5 rounded-2xl bg-primary/[0.04] border border-primary/15 hover:border-primary/25 transition-colors">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
        <Check className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-bold text-sm text-foreground">{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function ProblemSolution() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      id="problem-solution"
      aria-labelledby="ps-heading"
      className="relative z-10 py-24 px-6 w-full">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            The problem
          </span>
          <h2
            id="ps-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading">
            Most trackers treat you as a{" "}
            <span className="text-muted-foreground">number for today</span>.
            <br />
            <span className="text-primary">CalStory tracks your story.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The problems aren&apos;t technical — they&apos;re product decisions.
            Static targets, daily-number-only views, siloed workout tracking,
            and paywalled basics. Here&apos;s what we chose to fix.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Problems */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
              className="flex items-center gap-2 mb-6">
              <X className="w-4 h-4 text-muted-foreground shrink-0" />
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

          {/* Solutions */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
              className="flex items-center gap-2 mb-6">
              <Check className="w-4 h-4 text-muted-foreground shrink-0" />
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

        {/* Bottom divider arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="flex justify-center mt-12">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/8 border border-primary/20">
            <span className="text-xs text-primary font-bold">
              Real problems. Real product decisions.
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
