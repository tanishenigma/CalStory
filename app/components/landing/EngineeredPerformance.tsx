"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Utensils,
  Activity,
  Calendar,
  Target,
  Flame,
  Dumbbell,
  Zap,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

/* ─────────────────────────────────────────────
   TILT HOOK — mouse-tracking spring physics
   ───────────────────────────────────────────── */
const SPRING = { damping: 22, stiffness: 180, mass: 0.8 };

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const scale = useSpring(1, { damping: 18, stiffness: 200 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      rotateY.set((nx - 0.5) * 16);
      rotateX.set(-(ny - 0.5) * 16);
      glowX.set(nx * 100);
      glowY.set(ny * 100);
    },
    [rotateX, rotateY, glowX, glowY],
  );

  const onEnter = useCallback(() => scale.set(1.02), [scale]);

  const onLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }, [rotateX, rotateY, scale]);

  return {
    ref,
    rotateX,
    rotateY,
    glowX,
    glowY,
    scale,
    onMove,
    onEnter,
    onLeave,
  };
}

/* ─────────────────────────────────────────────
   CARD SHELL — tilt wrapper used by every card
   ───────────────────────────────────────────── */
function TiltCard({
  children,
  index,
  className = "",
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });
  const {
    ref,
    rotateX,
    rotateY,
    glowX,
    glowY,
    scale,
    onMove,
    onEnter,
    onLeave,
  } = useTilt();

  const spotlightBg = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(320px circle at ${x}% ${y}%, rgba(249,115,22,0.12) 0%, transparent 70%)`,
  );

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.55,
        delay: index * 0.07,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      style={{ perspective: "900px" }}
      className={className}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className="relative h-full bg-card border border-border rounded-2xl overflow-hidden
                   cursor-default transition-[border-color,box-shadow] duration-300
                   hover:border-primary/25 hover:shadow-[0_16px_48px_rgba(249,115,22,0.10)]">
        {/* Cursor spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl z-0"
          style={{ background: spotlightBg }}
        />
        {/* Content lifted on Z axis */}
        <div
          className="relative z-10 h-full"
          style={{ transform: "translateZ(8px)" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   SHARED: small icon badge
   ───────────────────────────────────────────── */
function IconBadge({ Icon }: { Icon: React.ElementType }) {
  return (
    <div
      className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20
                    flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CARD 1 — Precision AI Tracking
   ───────────────────────────────────────────── */
function Card1({ index }: { index: number }) {
  const meals = [
    { name: "Oatmeal & berries", kcal: 340 },
    { name: "Grilled chicken wrap", kcal: 520 },
    { name: "Greek yoghurt", kcal: 140 },
  ];
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });

  return (
    <TiltCard index={index}>
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Precision AI Tracking
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[200px]">
              Log meals in seconds. Macros shift in real-time.
            </div>
          </div>
          <IconBadge Icon={Utensils} />
        </div>

        <div className="flex flex-col gap-2">
          {meals.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                delay: 0.2 + i * 0.12,
                duration: 0.4,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex items-center justify-between bg-foreground/[0.03] border border-border/60 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-foreground">
                  {m.name}
                </span>
              </div>
              <span className="text-xs font-bold tabular-nums text-primary">
                {m.kcal} kcal
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Daily total</span>
            <span className="text-foreground font-bold">
              1,000 / 2,200 kcal
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: "45%" } : {}}
              transition={{
                duration: 1.1,
                delay: 0.5,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   CARD 2 — Dynamic TDEE
   ───────────────────────────────────────────── */
function Card2({ index }: { index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });
  const circum = 2 * Math.PI * 36;
  const dash = circum * 0.78;

  return (
    <TiltCard index={index}>
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Dynamic TDEE
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[180px]">
              Adapts to your metabolism daily.
            </div>
          </div>
          <IconBadge Icon={Activity} />
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-[88px] h-[88px] flex-shrink-0">
            <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
              <circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-foreground/[0.06]"
              />
              <motion.circle
                cx="44"
                cy="44"
                r="36"
                fill="none"
                stroke="url(#tdeeGrad)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circum}
                initial={{ strokeDashoffset: circum }}
                animate={inView ? { strokeDashoffset: circum - dash } : {}}
                transition={{
                  duration: 1.4,
                  delay: 0.3,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
              />
              <defs>
                <linearGradient id="tdeeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-foreground">
                78%
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                TDEE
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {[
              { label: "BMR", val: "1,820 kcal", w: "72%" },
              { label: "Activity", val: "+540 kcal", w: "38%" },
              { label: "Deficit", val: "−280 kcal", w: "20%" },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {row.val}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: row.w } : {}}
                    transition={{
                      duration: 0.9,
                      delay: 0.5 + i * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-auto text-[10px] text-muted-foreground flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Model updated 3 hours ago
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   CARD 3 — Consistency Loops (heatmap)
   ───────────────────────────────────────────── */
function Card3({ index }: { index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });
  const weeks = 5;
  const days = 7;
  const total = weeks * days;
  const streakStart = total - 3;

  const getIntensity = (i: number) => {
    if (i >= streakStart) return 1.0;
    const r = Math.random();
    if (r > 0.7) return 0.7;
    if (r > 0.4) return 0.45;
    if (r > 0.15) return 0.2;
    return 0;
  };

  const [intensities] = useState(() =>
    Array.from({ length: total }, (_, i) => getIntensity(i)),
  );

  return (
    <TiltCard index={index}>
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Consistency Loops
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[200px]">
              Psychology-backed streaks keep you in the zone.
            </div>
          </div>
          <IconBadge Icon={Calendar} />
        </div>

        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
          {Array.from({ length: total }, (_, i) => {
            const col = Math.floor(i / days);
            const row = i % days;
            const flat = col * days + row;
            const alpha = intensities[flat] ?? 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{
                  delay: 0.1 + flat * 0.008,
                  duration: 0.3,
                  ease: "backOut",
                }}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor:
                    alpha > 0
                      ? `rgba(249,115,22,${alpha})`
                      : "rgba(0,0,0,0.05)",
                }}
              />
            );
          })}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Flame size={12} className="text-primary" />
            <span className="text-xs font-bold text-primary">
              21 day streak
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Personal best 🎯
          </span>
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   CARD 4 — Elite Targets (macro dials)
   ───────────────────────────────────────────── */
function Card4({ index }: { index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });

  const macros = [
    { label: "Protein", val: 142, goal: 160, unit: "g", color: "#f97316" },
    { label: "Carbs", val: 180, goal: 250, unit: "g", color: "#fb923c" },
    { label: "Fat", val: 55, goal: 70, unit: "g", color: "#fdba74" },
  ];

  return (
    <TiltCard index={index}>
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Elite Targets
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[200px]">
              Custom macro goals dialled to your physiology.
            </div>
          </div>
          <IconBadge Icon={Target} />
        </div>

        <div className="flex items-center justify-around">
          {macros.map((m) => {
            const circum = 2 * Math.PI * 28;
            const pct = m.val / m.goal;
            return (
              <div key={m.label} className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-foreground/[0.06]"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke={m.color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circum}
                      initial={{ strokeDashoffset: circum }}
                      animate={
                        inView ? { strokeDashoffset: circum * (1 - pct) } : {}
                      }
                      transition={{
                        duration: 1.2,
                        delay: 0.3,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold text-foreground">
                    {m.label}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {m.val}/{m.goal}
                    {m.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <CheckCircle2 size={11} className="text-green-500" />
          Targets synced with TDEE model
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   CARD 5 — Instant Insights (sparkline, wide)
   ───────────────────────────────────────────── */
function Card5({ index }: { index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });

  const pts = [1840, 2100, 1750, 2200, 1900, 2050, 1840];
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const W = 260,
    H = 64;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * W);
  const ys = pts.map((v) => H - ((v - min) / (max - min)) * H * 0.8 - H * 0.1);
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const area =
    `M${xs[0]},${ys[0]} ` +
    xs
      .slice(1)
      .map((x, i) => `L${x},${ys[i + 1]}`)
      .join(" ") +
    ` L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;

  return (
    <TiltCard index={index} className="md:col-span-2">
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Instant Insights
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              7-day calorie trend — no digging required.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <TrendingUp size={10} className="text-green-500" />
              <span className="text-[10px] font-bold text-green-600">
                On track
              </span>
            </div>
            <IconBadge Icon={Flame} />
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl bg-foreground/[0.02] border border-border/60 p-4">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            preserveAspectRatio="none"
            style={{ height: 64 }}>
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={area}
              fill="url(#sparkFill)"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
            <motion.polyline
              points={polyline}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{
                duration: 1.4,
                delay: 0.3,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            />
            {xs.map((x, i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={ys[i]}
                r="3"
                fill="#f97316"
                initial={{ scale: 0, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.25 }}
              />
            ))}
          </svg>
          <div className="flex justify-between mt-2 px-0.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-[9px] text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Avg daily", val: "1,954 kcal" },
            { label: "Best day", val: "2,200 kcal" },
            { label: "Goal delta", val: "−246 kcal" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border/60">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {s.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   CARD 6 — Smart Workout Recognition
   ───────────────────────────────────────────── */
function Card6({ index }: { index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(innerRef, { once: true, amount: 0.3 });

  const exercises = [
    { name: "Bench Press", sets: "4×8", weight: "80 kg", pct: 88 },
    { name: "Cable Row", sets: "3×12", weight: "60 kg", pct: 72 },
    { name: "OHP", sets: "3×10", weight: "50 kg", pct: 65 },
  ];

  return (
    <TiltCard index={index}>
      <div ref={innerRef} className="p-6 sm:p-7 flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight font-heading text-foreground mb-1">
              Smart Workout
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-[200px]">
              Natural language logging — lightning fast.
            </div>
          </div>
          <IconBadge Icon={Dumbbell} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.04] border border-border/60 text-xs text-muted-foreground">
          <Sparkles size={11} className="text-primary flex-shrink-0" />
          <span className="italic">
            "Bench 80kg 4x8, cable rows 60kg 3x12…"
          </span>
        </motion.div>

        <div className="flex flex-col gap-2">
          {exercises.map((ex, i) => (
            <motion.div
              key={ex.name}
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                delay: 0.35 + i * 0.12,
                duration: 0.4,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-medium text-foreground">{ex.name}</span>
                <span className="text-muted-foreground">
                  {ex.sets} · {ex.weight}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${ex.pct}%` } : {}}
                  transition={{
                    duration: 1,
                    delay: 0.5 + i * 0.1,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Zap size={10} className="text-primary" />
          Logged in 4 seconds via AI
        </div>
      </div>
    </TiltCard>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
   ───────────────────────────────────────────── */
export default function EngineeredPerformance() {
  return (
    <section
      className="flex flex-col items-center px-2"
      aria-label="CalStory features at a glance">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <Card1 index={0} />
        <Card2 index={1} />
        <Card6 index={5} />
        <Card4 index={3} />
        <Card5 index={4} />
        {/* <Card3 index={2} /> */}
      </div>
    </section>
  );
}
