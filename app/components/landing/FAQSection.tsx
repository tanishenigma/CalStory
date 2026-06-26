"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Zap, Shield, Brain, TrendingUp } from "lucide-react";

const FAQS = [
  {
    q: "How does AI meal logging work?",
    a: "Tap 'Log with AI', describe what you ate in plain language and CalStory will extract the calories and macros. You can review and adjust the numbers before saving — nothing gets logged without your confirmation.",
    icon: Brain,
    color: "#f97316",
  },
  {
    q: "How is my TDEE calculated?",
    a: "CalStory uses the Mifflin-St Jeor formula with your height, weight, age, and weekly workout count to estimate your maintenance calories. As you log weight over time, the trend line adapts so your targets stay accurate.",
    icon: TrendingUp,
    color: "#f97316",
  },
  {
    q: "What does the streak counter track?",
    a: "Your streak counts consecutive days where you've logged at least one meal. The consistency heatmap on the Progress page shows the full 16-week picture so you can spot patterns in your habits.",
    icon: Zap,
    color: "#f97316",
  },
  {
    q: "Is my data stored securely?",
    a: "CalStory is open source — you deploy it to your own environment using your own database and API keys. Your data never touches our servers because there are no 'our servers'. Check the repo, read the code, and run it however you trust.",
    icon: Shield,
    color: "#f97316",
  },
];

/* ── Animated character-by-character text reveal ── */
function AnimatedText({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 12, filter: "blur(4px)" }
          }
          transition={{
            duration: 0.35,
            delay: delay + i * 0.018,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          style={{
            display: "inline-block",
            whiteSpace: char === " " ? "pre" : "normal",
          }}>
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Word-by-word reveal for subtitle ── */
function AnimatedWords({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.06,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          style={{ display: "inline-block", marginRight: "0.25em" }}>
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ── FAQ Item ── */
function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQS)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="w-full">
      <motion.div
        animate={
          isOpen
            ? {
                borderColor: "rgba(249,115,22,0.4)",
              }
            : {
                borderColor: "var(--color-border)",
                boxShadow: "0 0 0 0px rgba(249,115,22,0)",
              }
        }
        transition={{ duration: 0.3 }}
        className="rounded-2xl border bg-card overflow-hidden">
        {/* Question row */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 cursor-pointer group">
          {/* Icon badge */}
          <motion.div
            animate={
              isOpen
                ? { backgroundColor: "#f97316", color: "#fff", scale: 1.08 }
                : {
                    backgroundColor: "var(--color-subtle, #fafaf8)",
                    color: "var(--color-foreground)",
                    scale: 1,
                  }
            }
            transition={{ duration: 0.25 }}
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center">
            <Icon size={16} />
          </motion.div>

          {/* Question text */}
          <span className="flex-1 font-bold text-sm sm:text-base text-foreground tracking-tight">
            {item.q}
          </span>

          {/* Toggle icon */}
          <motion.div
            animate={{
              rotate: isOpen ? 45 : 0,
              backgroundColor: isOpen ? "#f97316" : "transparent",
            }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center">
            <Plus
              size={14}
              className="text-muted-foreground"
              style={{ color: isOpen ? "#fff" : undefined }}
            />
          </motion.div>
        </button>

        {/* Answer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="overflow-hidden">
              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-5 sm:mx-6 h-px bg-border origin-left"
              />
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -4, opacity: 0 }}
                transition={{ duration: 0.28, delay: 0.08 }}
                className="px-5 sm:px-6 pt-4 pb-5 text-left text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Floating decoration ── */
function FloatingDot({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-primary/30 pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{
        duration: 3 + delay,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, amount: 0.5 });

  return (
    <section
      id="faq"
      className="flex flex-col items-center text-center px-2 relative">
      {/* Floating decorative dots */}
      <FloatingDot x="5%" y="10%" delay={0} />
      <FloatingDot x="92%" y="25%" delay={1.2} />
      <FloatingDot x="8%" y="70%" delay={0.7} />
      <FloatingDot x="95%" y="75%" delay={1.8} />

      {/* Section header */}
      <div ref={titleRef} className="mb-10">
        {/* Eyebrow badge */}

        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight font-heading text-foreground block">
          <AnimatedText text="Frequently Asked" delay={0.05} />{" "}
          <AnimatedText
            text="Questions"
            className="text-primary"
            delay={0.42}
          />
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
          <AnimatedWords
            text="Everything you need to know about CalStory's AI-powered nutrition tracking."
            delay={0.65}
          />
        </motion.p>
      </div>

      {/* FAQ list */}
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {FAQS.map((item, i) => (
          <FAQItem
            key={item.q}
            item={item}
            index={i}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}
