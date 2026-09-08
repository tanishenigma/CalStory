"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
import {
  Zap,
  Brain,
  BarChart3,
  Dumbbell,
  Lock,
  Lightbulb,
} from "lucide-react";

const REASONS = [
  {
    n: "01",
    icon: Zap,
    title: "Log meals in plain English in < 9 seconds",
    body: 'Type "a veggie wrap and a protein shake" and CalStory returns a confirmed macro breakdown instantly. Gemini parses natural language food descriptions — no barcode scanner, no database archaeology, no dropdown menus.',
    tag: "AI Logging",
  },
  {
    n: "02",
    icon: Brain,
    title: "Calorie targets that adjust as your weight changes",
    body: "Most trackers give you a TDEE number on day one and leave it there. CalStory recalculates your maintenance calories from your actual logged weight trend every week — so your target stays accurate as you lose or gain.",
    tag: "Adaptive TDEE",
  },
  {
    n: "03",
    icon: Dumbbell,
    title: "Strength logging that actually tracks progressive overload",
    body: "Every working set — weight, reps, rest notes — logged in one tap. Save any session as a template and re-log it with pre-filled weights from your last session. The kind of tracking a lifter actually wants, not a cardio-first afterthought.",
    tag: "Strength Tracking",
  },
  {
    n: "04",
    icon: BarChart3,
    title: "See your story arc, not just today's number",
    body: "The Progress page shows a 16-week consistency heatmap, a calorie-vs-TDEE overlay, and a weight trend line. That's what a coach looks at — not a single day's calorie count. Patterns become visible in weeks, not months.",
    tag: "Progress Insights",
  },
  {
    n: "05",
    icon: Lock,
    title: "Your data lives in your Firebase account, not ours",
    body: "Every meal log, workout, and weight entry is stored in your own Firebase document under your UID. CalStory doesn't hold a copy. You can export or delete your data at any time and nothing is retained on our side.",
    tag: "Data Ownership",
  },
  {
    n: "06",
    icon: Lightbulb,
    title: "No ads, no dark patterns, no lock-in",
    body: "We don't sell your data. We don't gate the core tracker behind a paywall. The free tier gives you everything you need to track and improve — AI logs are the only thing behind the paid tier, and you can cancel anytime.",
    tag: "Clean Design",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

export default function ReasonsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      id="reasons"
      aria-labelledby="reasons-heading"
      className="relative z-10 py-24 px-6 w-full"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Why switch
          </span>
          <h2
            id="reasons-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading"
          >
            Six reasons this is{" "}
            <span className="text-primary">different from the rest</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Not feature-checkbox marketing. Specific things the architecture
            makes possible that a thin API wrapper can&apos;t do.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {REASONS.map((r) => (
            <motion.div
              key={r.n}
              variants={cardItem}
              className="group relative p-7 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
            >
              {/* Background number */}
              <div
                className="absolute -bottom-4 -right-2 text-[7rem] font-black leading-none text-foreground/[0.04] select-none pointer-events-none font-heading"
                aria-hidden="true"
              >
                {r.n}
              </div>

              {/* Top row */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[10px] font-black tracking-widest uppercase">
                  {r.tag}
                </span>
              </div>

              <h3 className="font-bold text-base leading-snug mb-3 font-heading tracking-tight">
                {r.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {r.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
