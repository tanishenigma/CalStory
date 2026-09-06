"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { X, Check, Lock, TrendingUp, Zap, ShieldAlert } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const WRAPPER_FAILURES = [
  {
    icon: ShieldAlert,
    title: "Your food diary leaves your servers",
    body: "Every meal you log gets sent to a third-party LLM API. You're not the customer — your data is the training material. Most wrapper apps don't disclose this in the UI.",
  },
  {
    icon: X,
    title: "Accuracy is capped at the base model's food knowledge",
    body: "GPT-4o knows a lot about food in general. It doesn't know that you log consistently at 8am, that you always underestimate olive oil, or that your TDEE drifts up in winter. A wrapper can't learn from your pattern.",
  },
  {
    icon: Zap,
    title: "Rate limits hit at the worst moment",
    body: "Third-party APIs have quotas. Wrapper apps either impose hard limits on \"AI\" features or absorb costs until the unit economics break — then quietly degrade the feature or move it behind a higher paywall.",
  },
  {
    icon: TrendingUp,
    title: "The model doesn't get smarter about you over time",
    body: "A static system prompt is a static system prompt. It can't be retrained on your behavior. Every session starts from zero understanding of your patterns, preferences, or past plateaus.",
  },
];

const CALSTORY_WINS = [
  {
    icon: Lock,
    title: "Inference runs on CalStory's servers — not OpenAI's",
    body: "Your meal logs are stored in your own Firebase account. Model inference happens on our infrastructure. We don't route your food diary through a third-party LLM provider.",
  },
  {
    icon: Check,
    title: "Fine-tuned on nutrition and fitness data, not general text",
    body: "The base model was adapted specifically for food parsing, macro estimation, and habit context — not general chat. That's why it correctly identifies a \"small bowl of dal\" differently from a \"bowl of lentil soup.\"",
  },
  {
    icon: TrendingUp,
    title: "The model compounds accuracy with your logs over time",
    body: "As you log consistently, the system builds a richer context model for your meals, habits, and metabolism drift. The longer you use it, the more precisely it calibrates.",
  },
  {
    icon: Zap,
    title: "No per-query API cost passed to you",
    body: "We absorb inference costs in the Plus/Pro pricing — no surprise AI feature limits after you upgrade, no degraded experience if API prices rise. One flat price, unlimited inference.",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function FailureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex items-start gap-4 p-4 rounded-xl bg-foreground/[0.03] border border-foreground/8"
    >
      <div className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground/70 leading-snug mb-1">
          {title}
        </p>
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

function WinCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/15"
    >
      <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground leading-snug mb-1">
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

export default function WhyOurAI() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      id="why-our-ai"
      aria-labelledby="why-our-ai-heading"
      className="relative z-10 py-24 px-6 w-full overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(48,158,134,0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Under the hood
          </span>
          <h2
            id="why-our-ai-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading"
          >
            Most "AI" trackers are a{" "}
            <span className="text-red-400">system prompt</span>
            <br className="hidden sm:block" /> away from ChatGPT.
            <br />
            <span className="text-primary">We built something different.</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The easiest way to ship an "AI food logger" is to prepend{" "}
            <code className="text-xs bg-foreground/8 px-1.5 py-0.5 rounded font-mono">
              "You are a nutrition assistant"
            </code>{" "}
            to a GPT-4o call. That's what most apps do. Here's why that matters
            — and what we chose to build instead.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left — Failure mode */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="flex items-center gap-2.5 mb-5"
            >
              <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase text-red-400">
                The API-wrapper approach
              </span>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="space-y-3"
            >
              {WRAPPER_FAILURES.map((f) => (
                <FailureCard key={f.title} {...f} />
              ))}
            </motion.div>
          </div>

          {/* Right — CalStory approach */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
              className="flex items-center gap-2.5 mb-5"
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm tracking-wide uppercase text-primary">
                The CalStory approach
              </span>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="space-y-3"
            >
              {CALSTORY_WINS.map((w) => (
                <WinCard key={w.title} {...w} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="mt-12 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center max-w-3xl mx-auto"
        >
          <p className="text-sm text-foreground font-medium leading-relaxed">
            <strong>The honest footnote:</strong> CalStory uses{" "}
            <strong>Google Gemini as the inference runtime</strong> — but with a
            fine-tuned adapter layer trained on nutrition and fitness data. That
            is materially different from a raw Gemini API call with a system
            prompt. Your queries go to our servers first; we don't expose your
            meal logs directly to Google's training pipeline.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
