"use client";
import React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
  inView?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// ease-out-quart — the right curve for elements entering the screen.
// Fast start → instant feedback; slow finish → settles gracefully.
const EASE_OUT_QUART = [0.165, 0.84, 0.44, 1] as const;

export default function BlurFade({
  children,
  delay = 0,
  duration = 0.3,
  yOffset = 8,
  blur = "4px",
  inView = false,
  className = "",
  style,
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = inView ? isInView : true;

  // When the user prefers reduced motion: skip y-movement and blur,
  // only fade opacity. This respects accessibility without removing
  // all sense of transition.
  const initial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: yOffset, filter: `blur(${blur})` };

  const animate = shouldAnimate
    ? shouldReduceMotion
      ? { opacity: 1 }
      : { opacity: 1, y: 0, filter: "blur(0px)" }
    : {};

  const reducedTransition: Transition = { duration: 0.15, delay, ease: "easeOut" };
  const fullTransition: Transition = {
    duration,
    delay,
    ease: EASE_OUT_QUART,
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={shouldReduceMotion ? reducedTransition : fullTransition}
      className={className}
      style={style}>
      {children}
    </motion.div>
  );
}
