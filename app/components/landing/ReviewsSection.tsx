"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─────────────────────────────────────────────────────────────
 * PLACEHOLDER REVIEWS — swap these out for real, verified
 * testimonials before launch. Names, goals, and quotes below
 * are realistic-sounding but generic placeholders.
 * ───────────────────────────────────────────────────────────── */
const REVIEWS = [
  {
    name: "Aarav M.",
    subtitle: "Marathon runner",
    initials: "AM",
    color: "bg-primary",
    quote:
      "The adaptive TDEE is the reason I stuck with it. My targets actually move with my training block instead of staying frozen for months.",
  },
  {
    name: "Sneha K.",
    subtitle: "Lost 18 lbs in 4 months",
    initials: "SK",
    color: "bg-purple",
    quote:
      "Logging takes me under ten seconds now. The streak heatmap makes it genuinely hard to break the chain — I've never been this consistent.",
  },
  {
    name: "Rohan D.",
    subtitle: "Strength training, 2 years",
    initials: "RD",
    color: "bg-cyan",
    quote:
      "Finally one app for both my food and my lifts. Templates and re-log with last week's weights save me so much time in the gym.",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

function StarRow() {
  return (
    <div className="flex items-center gap-1" aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="w-4 h-4 text-foreground"
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      ref={ref}
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative z-10 py-16 md:py-32 px-6 w-full">
      <div className="max-w-6xl mx-auto">
        {/* ── Heading block ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12 md:mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Reviews
          </span>
          <h2
            id="reviews-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading">
            Loved by lifters, runners, and{" "}
            <span className="text-primary">everyone in between</span>.
          </h2>
        </motion.div>

        {/* ── Review cards ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <motion.div
              key={r.name}
              variants={cardItem}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-shadow duration-300">
              {/* Stars */}
              <StarRow />

              {/* Quote */}
              <p className="mt-4 text-sm text-foreground leading-relaxed font-medium flex-1">
                &ldquo;{r.quote}&rdquo;
              </p>

              {/* Divider */}
              <div className="h-px bg-border my-5" aria-hidden="true" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${r.color} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                  {r.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {r.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.subtitle}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
