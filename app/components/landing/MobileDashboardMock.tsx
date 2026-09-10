"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Flame,
  Sun,
  Sunrise,
  Moon,
  Apple,
  Utensils,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { DAY_LABELS } from "@/app/lib/constants";

/* ───────────────────────────────────────────────────────────────
 * MobileDashboardMock — phone-shaped mock of the real CalStory
 * dashboard as it actually looks on mobile. Mirrors the real
 * mobile layout 1:1 so the landing page accurately previews the
 * product on a phone:
 *
 *   • Mobile-only header: CalStory logo + flame wordmark on the
 *     left, circular streak badge (flame + number) on the right.
 *   • Scrollable 7-day strip with circular day pills (size-12).
 *     Today's pill is filled black with white text; other days are
 *     muted with a small primary-color dot underneath if data exists.
 *   • Calories card — same compact layout as desktop but sized for
 *     a phone-width canvas.
 *   • Macro pills — stacked vertically as full-width rows (NOT
 *     3-in-a-column like the desktop reference mock — that layout
 *     doesn't exist on mobile).
 *   • Today's Workout + Today's Meals sections, each with a header
 *     + "See all →" link + a single row card.
 *   • Bottom-right floating action button (utensils icon) — same
 *     position as the real `FAB.tsx`.
 *
 * The mock auto-plays the same looping demo as the desktop mock
 * (ring fills, meal animates into the list, FAB pulses) so it feels
 * alive. Looping is gated on `useInView`.
 * ─────────────────────────────────────────────────────────────── */

/* ── Semantic surface helpers — use Tailwind design-token utilities
 * so the mock renders correctly on the forced-light landing page.
 * SURFACE → white card (var(--color-card))
 * BORDER  → hairline divider (var(--color-border)) */
const SURFACE = "bg-card";
const SURFACE_HOVER = "hover:bg-accent/50";
const BORDER = "border border-border";

/* ── Mock data ──────────────────────────────────────────────── */

const WORKOUT_DEMO = {
  name: "Back Day",
  subtitle: "50 Min • Resistance",
  emoji: "💪",
};

type MealDemo = {
  id: string;
  icon: LucideIcon;
  name: string;
  time: string;
  cal: number;
  hasData: boolean; // drives the dot under the day in the strip
};

const MEAL_DEMO_POOL: MealDemo[] = [
  {
    id: "m1",
    icon: Sun,
    name: "Grilled Tofu with Brown Rice Bowl",
    time: "Lunch",
    cal: 360,
    hasData: true,
  },
  {
    id: "m2",
    icon: Apple,
    name: "Greek Yogurt + Almonds",
    time: "Snack",
    cal: 210,
    hasData: true,
  },
  {
    id: "m3",
    icon: Moon,
    name: "Veggie Burrito Bowl",
    time: "Lunch",
    cal: 480,
    hasData: true,
  },
  {
    id: "m4",
    icon: Sunrise,
    name: "Oats, Banana, Peanut Butter",
    time: "Breakfast",
    cal: 320,
    hasData: true,
  },
];

/* 7-day window — anchor on a fixed reference date so SSR/CSR
 * output matches. "Today" is the 4th day (Thursday) so the demo
 * looks lived-in: a couple past days with data, today highlighted,
 * future days disabled. */
const TODAY_INDEX = 3;
const REFERENCE_DAY = 15; // Mon — first day of the strip

const WEEK_DAYS = DAY_LABELS.map((label, i) => ({
  label,
  day: REFERENCE_DAY + i,
  // Past 3 days have data, today has data, future days don't.
  hasData: i <= TODAY_INDEX,
  isFuture: i > TODAY_INDEX,
  isToday: i === TODAY_INDEX,
}));

/* ─────────────────────────────────────────────────────────────
 * Subcomponents
 * ───────────────────────────────────────────────────────────── */

/**
 * Brand mark — small black circle with white flame inside.
 * Mirrors the mobile WeekStrip header.
 */
function MobileBrand({ size = 14 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white grid place-items-center shrink-0"
      style={{ width: size + 12, height: size + 12 }}>
      <Flame size={size} className="text-foreground" fill="currentColor" />
    </div>
  );
}

/**
 * Circular streak badge — flame + number, exactly like the real
 * mobile `WeekStrip.tsx` header.
 */
function StreakBadge({
  streak,
  hasLoggedToday,
}: {
  streak: number;
  hasLoggedToday: boolean;
}) {
  return (
    <div className="flex h-11 w-11 items-center justify-center gap-1 rounded-full border border-border bg-accent px-1.5 shadow-md sm:h-12 sm:w-12 sm:gap-1.5 sm:px-2.5">
      <Flame
        size={15}
        className={hasLoggedToday ? "text-primary" : "text-muted-foreground/40"}
        fill={hasLoggedToday ? "currentColor" : "rgba(0,0,0,0.1)"}
      />
      <span className="text-sm font-bold tabular-nums text-foreground sm:text-base">
        {streak}
      </span>
    </div>
  );
}

/**
 * Mobile day pill — circular button (size-12) with day label + date
 * number + a small primary-colored dot underneath if data exists.
 * Today's pill is filled black with white text (matches `WeekStrip`).
 */
function MobileDayPill({
  label,
  day,
  active,
  hasData,
  isFuture,
  onClick,
}: {
  label: string;
  day: number;
  active: boolean;
  hasData: boolean;
  isFuture: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isFuture}
      whileTap={isFuture ? undefined : { scale: 0.94 }}
      className={[
        "flex size-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full p-1 transition-colors sm:size-12 sm:gap-1 sm:p-2",
        isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
        active
          ? "bg-foreground border-2 border-transparent"
          : "border-2 border-transparent hover:bg-accent/50",
      ].join(" ")}
      aria-pressed={active}>
      <span
        className={[
          "text-[9px] font-bold tracking-wider uppercase leading-none sm:text-[10px]",
          active ? "text-background" : "text-muted-foreground/60",
        ].join(" ")}>
        {label}
      </span>
      <span
        className={[
          "text-sm font-semibold leading-none tabular-nums sm:text-base",
          active ? "text-background" : "text-foreground",
        ].join(" ")}>
        {day}
      </span>
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-primary"
        initial={false}
        animate={{ scale: hasData ? 1 : 0, opacity: hasData ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      />
    </motion.button>
  );
}

function MobileRing({ pct }: { pct: number }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(Math.max(pct, 0), 1));

  return (
    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
      <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-3xl select-none pointer-events-none">
        🔥
      </div>
    </div>
  );
}

/**
 * Mobile calories card — same compact style as the desktop mock,
 * sized for a phone-width canvas. Uses intrinsic height (not h-full)
 * because macros are stacked below it on mobile, not side-by-side.
 */
function MobileCaloriesCard({
  left,
  completed,
  pct,
}: {
  left: number;
  completed: boolean;
  pct: number;
}) {
  return (
    <div
      className={`${SURFACE} ${BORDER} flex items-center justify-between gap-2 rounded-2xl px-3 py-3 sm:gap-4 sm:px-5 sm:py-4`}>
      <div className="min-w-0 flex-1">
        <div className="text-3xl font-extrabold leading-none tracking-tight text-foreground tabular-nums sm:text-4xl">
          {left}
        </div>
        <div className="mb-2 mt-1 text-[11px] font-semibold text-muted-foreground sm:mb-3 sm:mt-1.5 sm:text-xs">
          Calories Left
        </div>
        <div
          className={[
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold sm:gap-1.5 sm:px-2 sm:py-1 sm:text-[10px]",
            completed
              ? "bg-primary/15 text-primary"
              : "bg-accent text-muted-foreground",
          ].join(" ")}>
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              completed ? "bg-primary" : "bg-muted-foreground/40",
            ].join(" ")}
          />
          {completed ? "Day completed" : "Tracking…"}
        </div>
      </div>
      <MobileRing pct={pct} />
    </div>
  );
}

/**
 * Mobile macro row — full-width row with colored circular icon,
 * "Ng <Macro> Left" label, chevron. Matches the real
 * `MacroPills.tsx` rows on mobile.
 */
function MobileMacroRow({
  emoji,
  color,
  label,
  value,
}: {
  emoji: string;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <button
      type="button"
      className={`${SURFACE} ${BORDER} flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-left transition-all ${SURFACE_HOVER} active:scale-[0.99] cursor-pointer sm:gap-3 sm:px-4 sm:py-3.5`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`,
          }}>
          <span className="text-lg leading-none sm:text-2xl">{emoji}</span>
        </div>
        <span className="truncate text-sm font-bold text-foreground sm:text-base">
          <span style={{ color }}>{value}</span>
          <span className="text-muted-foreground">g</span>{" "}
          <span>{label} Left</span>
        </span>
      </div>
      <ArrowUpRight size={15} className="shrink-0 text-muted-foreground/40 sm:h-[18px] sm:w-[18px]" />
    </button>
  );
}

function MobileMealRow({ meal }: { meal: MealDemo }) {
  const Icon = meal.icon;
  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-accent/50 sm:gap-3 sm:px-3 sm:py-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent sm:h-10 sm:w-10">
        <Icon size={15} className="text-muted-foreground sm:h-[17px] sm:w-[17px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-xs font-bold text-foreground sm:text-sm">
          {meal.name}
        </div>
        <div className="text-[10px] text-muted-foreground sm:text-[11px]">{meal.time}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-foreground tabular-nums sm:text-base">
          {meal.cal}
        </div>
        <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 sm:text-[9px]">
          kcal
        </div>
      </div>
    </div>
  );
}

function MobileFab() {
  return (
    <motion.button
      type="button"
      aria-label="Add meal"
      className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
      <Utensils size={20} strokeWidth={2.4} className="sm:size-6" />
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Main MobileDashboardMock
 * ───────────────────────────────────────────────────────────── */

export function MobileDashboardMock() {
  const [activeDay, setActiveDay] = useState(TODAY_INDEX);

  /* Auto-play loop — same pattern as the desktop mock */
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3 });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % 8);
    }, 2200);
    return () => clearInterval(id);
  }, [inView]);

  /* Derived demo values */
  const targetCal = 2000;
  const eaten = useMemo(() => Math.min(targetCal, 350 + phase * 120), [phase]);
  const left = Math.max(0, targetCal - eaten);
  const pct = eaten / targetCal;
  const completed = eaten >= targetCal * 0.9;

  const cLeft = useMemo(() => Math.max(0, 51 - phase * 6), [phase]);
  const pLeft = useMemo(() => Math.max(0, 22 - phase * 2), [phase]);
  const fLeft = useMemo(() => Math.max(0, 19 - phase * 2), [phase]);

  const visibleMeals = useMemo(() => {
    const count = Math.min(phase + 1, 3);
    const pool = MEAL_DEMO_POOL;
    return Array.from(
      { length: count },
      (_, i) => pool[(phase + i) % pool.length],
    );
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl flex flex-col text-foreground bg-background border border-border"
      role="img"
      aria-label="Live preview of the CalStory dashboard on mobile">
      {/* ── Mobile-only header: logo + streak ── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MobileBrand size={12} />
          <span className="font-heading text-sm font-bold tracking-tight text-foreground sm:text-base">
            CalStory
          </span>
        </div>
        <StreakBadge streak={5} hasLoggedToday />
      </div>

      {/* ── Week strip ── */}
      <div className="px-1.5 pb-2 sm:px-2 sm:pb-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1.5 py-1 sm:gap-2 sm:px-2">
          {WEEK_DAYS.map((d, i) => (
            <MobileDayPill
              key={d.label}
              label={d.label}
              day={d.day}
              active={i === activeDay}
              hasData={d.hasData}
              isFuture={d.isFuture}
              onClick={() => setActiveDay(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Main scrollable content ── */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-16 sm:space-y-3 sm:px-4 sm:pb-20">
        {/* Calories card */}
        <MobileCaloriesCard left={left} completed={completed} pct={pct} />

        {/* Macros — stacked full-width rows, like the real mobile app */}
        <MobileMacroRow
          emoji="🍞"
          color="var(--color-primary)"
          label="Carbs"
          value={cLeft}
        />
        <MobileMacroRow
          emoji="🥛"
          color="var(--color-red)"
          label="Protein"
          value={pLeft}
        />
        <MobileMacroRow
          emoji="🥑"
          color="var(--color-amber)"
          label="Fats"
          value={fLeft}
        />

        {/* Today's Workout */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-foreground">
              Today's Workout
            </span>
            <button
              type="button"
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer">
              See all <ArrowUpRight size={11} />
            </button>
          </div>
          <div
            className={`${SURFACE} ${BORDER} rounded-2xl px-3 py-3 flex items-center gap-3 ${SURFACE_HOVER} transition-colors cursor-pointer`}>
            <div className="w-10 h-10 rounded-xl bg-accent grid place-items-center text-lg shrink-0">
              <span aria-hidden>{WORKOUT_DEMO.emoji}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-foreground truncate">
                {WORKOUT_DEMO.name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {WORKOUT_DEMO.subtitle}
              </div>
            </div>
          </div>
        </section>

        {/* Today's Meals */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-foreground">
              Today's Meals
            </span>
            <button
              type="button"
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer">
              See all <ArrowUpRight size={11} />
            </button>
          </div>
          <div
            className={`${SURFACE} ${BORDER} rounded-2xl p-1 flex flex-col gap-0.5 overflow-hidden`}>
            <AnimatePresence initial={false}>
              {visibleMeals.map((m, i) => (
                <motion.div
                  key={`${m.id}-${i}`}
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}>
                  <MobileMealRow meal={m} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* FAB */}
      <MobileFab />
    </div>
  );
}

export default MobileDashboardMock;
