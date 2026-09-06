"use client";

import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Marcus T.",
    goal: "Bulking",
    initials: "MT",
    color: "bg-primary",
    quote:
      "I've tried MyFitnessPal, Cronometer, even a Google Sheet macro. Nothing stuck past month two. CalStory's AI logger removes the friction — I just tell it what I ate and it handles the math. Six months in, finally making consistent strength gains.",
  },
  {
    name: "Priya S.",
    goal: "Fat Loss",
    initials: "PS",
    color: "bg-purple",
    quote:
      "The adaptive TDEE feature is the thing I didn't know I needed. After my first plateau, it automatically nudged my targets down based on my real logged data. I didn't have to guess or recalculate — it just worked. Dropped 8 kg over 14 weeks.",
  },
  {
    name: "Jordan K.",
    goal: "Maintenance",
    initials: "JK",
    color: "bg-cyan",
    quote:
      "Logging used to feel like a chore. Now it's 9 seconds of typing and I'm done. The streak heatmap is genuinely motivating — seeing 30+ days of green makes it hard to break the chain. My relationship with food is completely different.",
  },
  {
    name: "Ava R.",
    goal: "Recomp",
    initials: "AR",
    color: "bg-amber",
    quote:
      "I track both my lifting and my food here — no more switching between apps. The progress charts showed me I was consistently under on protein despite hitting my calorie target. Fixed that, and my lifts started moving again after weeks of stalling.",
  },
];

export default function TestimonialsCarousel() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const [active, setActive] = useState(0);
  const total = TESTIMONIALS.length;

  const prev = useCallback(
    () => setActive((a) => (a - 1 + total) % total),
    [total],
  );
  const next = useCallback(() => setActive((a) => (a + 1) % total), [total]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [inView, next]);

  return (
    <section
      ref={ref}
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative z-10 py-24 px-6 w-full"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Real users
          </span>
          <h2
            id="testimonials-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight font-heading"
          >
            What people are{" "}
            <span className="text-primary">saying</span>.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 md:p-12 rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
            >
              {/* Background quote mark */}
              <Quote
                className="absolute top-6 right-8 w-20 h-20 text-primary/5"
                aria-hidden="true"
              />

              <blockquote className="relative">
                <p className="text-base md:text-xl text-foreground leading-relaxed mb-8 font-medium">
                  &ldquo;{TESTIMONIALS[active].quote}&rdquo;
                </p>

                <footer className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-full ${TESTIMONIALS[active].color} flex items-center justify-center text-white font-black text-sm shrink-0`}
                  >
                    {TESTIMONIALS[active].initials}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">
                      {TESTIMONIALS[active].name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Goal: {TESTIMONIALS[active].goal}
                    </div>
                  </div>
                  {/* Dots */}
                  <div className="ml-auto flex items-center gap-2">
                    {TESTIMONIALS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        aria-label={`Go to testimonial ${i + 1}`}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          i === active
                            ? "bg-primary w-5"
                            : "bg-border hover:bg-primary/40"
                        }`}
                      />
                    ))}
                  </div>
                </footer>
              </blockquote>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-border bg-card hover:bg-subtle hover:border-primary/30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-border bg-card hover:bg-subtle hover:border-primary/30 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
