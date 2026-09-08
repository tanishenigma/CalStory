"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";

const STATS = [
  { value: 12000, suffix: "+", label: "Active users", decimals: 0 },
  { value: 2.1, suffix: "M", label: "Meals logged", decimals: 1 },
  {
    value: 9,
    prefix: "< ",
    suffix: " sec",
    label: "Avg. meal log time",
    decimals: 0,
  },
  { value: 4.9, suffix: " ★", label: "Average rating", decimals: 1 },
];

function CountUp({
  value,
  suffix,
  prefix = "",
  decimals,
}: {
  value: number;
  suffix: string;
  prefix?: string;
  decimals: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, value, {
      duration: 1.8,
      ease: "easeOut",
    });
    return controls.stop;
  }, [inView, motionVal, value]);

  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const unsub = motionVal.on("change", (v) => {
      setDisplay(
        decimals > 0 ? v.toFixed(decimals) : Math.floor(v).toLocaleString(),
      );
    });
    return unsub;
  }, [motionVal, decimals]);

  return (
    <span ref={ref} className="num tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export default function StatsBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <div
      ref={ref}
      className="w-full py-16 px-6 bg-foreground dark:bg-foreground/90 text-background overflow-hidden relative">
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 25%, transparent) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 15%, transparent) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10">
          <span className="text-xs font-black tracking-widest uppercase text-primary">
            By the numbers
          </span>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.55,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center">
              <div className="text-4xl md:text-5xl font-black leading-none mb-2 text-white">
                <CountUp {...s} />
              </div>
              <div className="text-sm text-white/60 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
