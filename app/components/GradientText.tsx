"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface GradientTextProps {
  text: string;
  className?: string;
  fullBleed?: boolean;
}

const BASE_PX = 100;

export default function GradientText({
  text,
  className = "",
  fullBleed = false,
}: GradientTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const inViewRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);
  const inView = useInView(inViewRef, { once: true, amount: 0.3 });

  // Measure and scale text to fill the viewport width
  useEffect(() => {
    if (!fullBleed) return;

    const measure = () => {
      const el = textRef.current;
      if (!el) return;

      el.style.fontSize = `${BASE_PX}px`;
      const textWidth = el.scrollWidth;
      const targetWidth = window.innerWidth;

      if (textWidth > 0 && targetWidth > 0) {
        setFontSize((targetWidth / textWidth) * BASE_PX);
      }
    };

    measure();
    window.addEventListener("resize", measure);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }

    return () => window.removeEventListener("resize", measure);
  }, [fullBleed, text]);

  // Build the per-letter spans. fullBleed wraps each in a motion.span so we
  // can stagger a drop-in entrance.
  const letters = text.split("").map((char, i) => {
    if (char === " ") return <span key={i}>&nbsp;</span>;

    if (fullBleed) {
      return (
        <motion.span
          key={i}
          className={i % 2 === 0 ? "letter-grad-down" : "letter-grad-up"}
          initial={{ y: "60%", opacity: 0 }}
          animate={inView ? { y: "0%", opacity: 1 } : { y: "60%", opacity: 0 }}
          transition={{
            duration: 0.9,
            delay: 0.04 * i,
            ease: [0.22, 1, 0.36, 1],
          }}>
          {char}
        </motion.span>
      );
    }

    return (
      <span
        key={i}
        className={i % 2 === 0 ? "letter-grad-down" : "letter-grad-up"}>
        {char}
      </span>
    );
  });

  if (!fullBleed) {
    return <span className={className}>{letters}</span>;
  }

  return (
    <motion.span
      ref={inViewRef}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative block w-full overflow-hidden text-center ${className}`}
      style={{ lineHeight: 0.85 }}>
      <span
        ref={textRef}
        className="relative inline-block whitespace-nowrap fullbleed-gradient"
        style={{
          fontSize: fontSize ? `${fontSize}px` : `${BASE_PX}px`,
          opacity: fontSize ? 1 : 0,
        }}>
        {letters}
      </span>
    </motion.span>
  );
}
