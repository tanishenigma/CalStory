"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  Plus,
  ArrowUpRight,
  Sun,
  Sunrise,
  Moon,
  Apple,
  type LucideIcon,
} from "lucide-react";
import { DAY_LABELS } from "@/app/lib/constants";

/* ───────────────────────────────────────────────────────────────
 * DashboardMock — live, interactive dummy of the real CalStory
 * dashboard, rendered as real React components (not an image).
 * Dropped into the landing-page hero in place of the static
 * dashboard screenshot.
 *
 * Visual reference: a true dark dashboard. The hero lives on a
 * forced-dark page so the mock is intentionally dark end-to-end
 * (no white cards, no pastel blobs). Card surfaces are a slightly
 * lighter shade of the page background, text is high-contrast
 * white. The "Calories Left" card keeps a constant, compact
 * height — the same height as the macros column beside it — so
 * the row never reflows as the calorie number changes.
 *
 * The mock auto-plays a short looping demo: the calorie ring
 * animates filling, a meal animates into the "Recently uploaded"
 * list, the FAB pulses, and the macro numbers tick down —
 * simulating a real logging action. Looping is gated on
 * `useInView` so it pauses off-screen to avoid burning CPU above
 * the fold.
 * ─────────────────────────────────────────────────────────────── */

/* ── Mock data ──────────────────────────────────────────────── */

const SIDEBAR_ITEMS: {
  key: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "nutrition", label: "Nutrition", Icon: UtensilsCrossed },
  { key: "workouts", label: "Workouts", Icon: Dumbbell },
  { key: "progress", label: "Progress", Icon: TrendingUp },
];

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
};

// Cycled through by the auto-play demo — each iteration "logs" a
// new meal so it animates into the Recently uploaded list.
const MEAL_DEMO_POOL: MealDemo[] = [
  {
    id: "m1",
    icon: Sun,
    name: "Grilled Chicken with Brown Rice Bowl",
    time: "Lunch",
    cal: 360,
  },
  {
    id: "m2",
    icon: Apple,
    name: "Greek Yogurt + Almonds",
    time: "Snack",
    cal: 210,
  },
  {
    id: "m3",
    icon: Moon,
    name: "3 Butter Roti and Achari Chaap",
    time: "Lunch",
    cal: 480,
  },
  {
    id: "m4",
    icon: Sunrise,
    name: "Oats, Banana, Peanut Butter",
    time: "Breakfast",
    cal: 320,
  },
];

/* 7-day window — anchor on a fixed reference date so the SSR/CSR
 * output matches (no `new Date()` drift between render passes). */
const REFERENCE_DAY = 16;
const WEEK_DAYS = DAY_LABELS.map((label, i) => ({
  label,
  day: REFERENCE_DAY + i,
}));

/* ─────────────────────────────────────────────────────────────
 * Subcomponents
 * ───────────────────────────────────────────────────────────── */

function FlameLogo({ size = 14 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-white grid place-items-center shrink-0"
      style={{ width: size + 12, height: size + 12 }}>
      <Flame size={size} className="text-black" fill="currentColor" />
    </div>
  );
}

/* Dark-surface helpers — used throughout the mock so the entire
 * tree reads as one consistent dark theme instead of a patchwork
 * of light and dark cards. The exact shade is intentionally
 * slightly above the page background to read as a "card surface"
 * without going white. */
const SURFACE = "bg-white/[0.04]";
const SURFACE_HOVER = "hover:bg-white/[0.06]";
const BORDER = "border-white/10";

function Sidebar({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (k: string) => void;
}) {
  return (
    <aside className="hidden md:flex md:w-17 lg:w-44 shrink-0 border-r border-white/5 flex-col py-4">
      {/* Brand */}
      <div className="px-3 lg:px-4 flex items-center gap-2 mb-6">
        <FlameLogo size={14} />
        <span className="hidden lg:inline font-heading font-bold text-sm text-white tracking-tight">
          CalStory
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {SIDEBAR_ITEMS.map(({ key, label, Icon }) => {
          const active = activeKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={[
                "group flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2 lg:px-3 py-2 text-xs font-semibold transition-all cursor-pointer",
                active
                  ? "bg-white text-black"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              ].join(" ")}>
              <Icon size={15} className="shrink-0" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User row */}
      <div className="px-2 mt-4 flex flex-col gap-2">
        <button
          type="button"
          className="flex items-center justify-center lg:justify-start gap-3 rounded-xl px-2 lg:px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
          <Settings size={15} />
          <span className="hidden lg:inline">Settings</span>
        </button>
      </div>
    </aside>
  );
}

function WeekDayButton({
  label,
  day,
  active,

  onClick,
}: {
  label: string;
  day: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-0.5 w-9 h-11 rounded-full transition-colors cursor-pointer group"
      aria-label={`${label} ${day}`}>
      {active ? (
        <motion.span
          layoutId="mock-day-ring"
          className="absolute inset-0 rounded-full border border-dashed border-white/60"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
      <span
        className={[
          "text-[9px] font-bold tracking-widest",
          active ? "text-white" : "text-white/40",
        ].join(" ")}>
        {label}
      </span>
      <span
        className={[
          "text-[13px] font-bold tabular-nums",
          active ? "text-white" : "text-white/70 group-hover:text-white",
        ].join(" ")}>
        {day}
      </span>
    </button>
  );
}

function TopBar({
  activeDayIndex,
  onDayChange,
  streak,
}: {
  activeDayIndex: number;
  onDayChange: (i: number) => void;
  streak: number;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b border-white/5">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {/* Prev/next arrows — hidden on tiny screens so the 7-day
         * strip has room to breathe. */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous day"
            className="w-7 h-7 rounded-full grid place-items-center text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Next day"
            className="w-7 h-7 rounded-full grid place-items-center text-white/50 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 7-day strip */}
        <div className="flex items-center gap-0.5 ml-0.5 sm:ml-1 overflow-hidden">
          {WEEK_DAYS.map((d, i) => (
            <WeekDayButton
              key={d.label}
              label={d.label}
              day={d.day}
              active={i === activeDayIndex}
              onClick={() => onDayChange(i)}
            />
          ))}
        </div>

        {/* Calendar icon — hidden on tiny screens. */}
        <button
          type="button"
          aria-label="Calendar"
          className="hidden sm:grid ml-1 w-7 h-7 rounded-full place-items-center text-white/50 hover:bg-white/5 hover:text-white transition-all cursor-pointer">
          <CalendarIcon size={14} />
        </button>
      </div>

      {/* Streak pill */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-white/5 border border-white/10 shrink-0">
        <Flame size={12} className="text-orange-400" fill="currentColor" />
        <span className="text-xs font-bold tabular-nums text-white">
          {streak}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Animated calorie ring — sized to match the compact reference
 * (~100px diameter). Fill animates with Framer's `animate` prop on
 * the SVG `strokeDashoffset`. Flame icon centered inside.
 * ───────────────────────────────────────────────────────────── */
function CalorieRing({ pct }: { pct: number }) {
  const R = 32;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(Math.max(pct, 0), 1));

  return (
    <div className="relative w-20 h-20 sm:w-25 sm:h-25 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white grid place-items-center">
          <Flame
            size={16}
            className="text-black sm:size-4.5"
            fill="currentColor"
          />
        </div>
      </div>
    </div>
  );
}

/* Compact Calories card. `h-full` keeps the card exactly as tall
 * as the macros column beside it on md+ — the number can change
 * freely without the card ever reflowing. On mobile (stacked
 * layout) the card falls back to its intrinsic content height. */
function CaloriesCard({
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
      className={`${SURFACE} ${BORDER} rounded-2xl  px-4 sm:px-5 py-4 md:h-64 flex items-center justify-between gap-3 sm:gap-4`}>
      <div className="min-w-0 flex-1">
        <div className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-white tabular-nums ">
          {left}
        </div>
        <div className="text-xs font-semibold text-white/50 mt-1.5 mb-3">
          Calories Left
        </div>
        <div
          className={[
            "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full",
            completed
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/5 text-white/60",
          ].join(" ")}>
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              completed ? "bg-emerald-400" : "bg-white/40",
            ].join(" ")}
          />
          {completed ? "Day completed" : "Tracking…"}
        </div>
      </div>
      <CalorieRing pct={pct} />
    </div>
  );
}

function MacroCard({
  emoji,
  color,
  label,
  value,
  unit,
}: {
  emoji: string;
  color: string;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <button
      type="button"
      className={`${SURFACE} ${BORDER} rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 ${SURFACE_HOVER} active:scale-[0.99] transition-all cursor-pointer w-full text-left`}>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-lg leading-none"
          style={{ backgroundColor: `${color}1A` /* ~10% alpha */ }}>
          <span>{emoji}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
            {label}
          </div>
          <div className="text-sm font-bold text-white tabular-nums">
            <span style={{ color }}>{value}</span>
            <span className="text-white/50">{unit}</span>{" "}
            <span className="text-white/40 font-medium">Left</span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-white/40 shrink-0" />
    </button>
  );
}

function MealRow({ meal }: { meal: MealDemo }) {
  const Icon = meal.icon;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center shrink-0">
        <Icon size={15} className="text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-white truncate">
          {meal.name}
        </div>
        <div className="text-[11px] text-white/40">{meal.time}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] font-bold text-white tabular-nums">
          {meal.cal}
        </div>
        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
          kcal
        </div>
      </div>
    </div>
  );
}

function Fab() {
  return (
    <motion.button
      type="button"
      aria-label="Add meal"
      className="absolute bottom-4 right-4 w-12 h-12 sm:w-11 sm:h-11 rounded-full bg-white text-black grid place-items-center shadow-xl shadow-black/40 cursor-pointer"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
      <Plus size={22} strokeWidth={2.5} className="sm:size-5" />
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Main DashboardMock
 * ───────────────────────────────────────────────────────────── */

export function DashboardMock() {
  const [activeNav, setActiveNav] = useState("home");
  const [activeDay, setActiveDay] = useState(0);

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

  /* Derived demo values from the phase counter */
  const targetCal = 2000;
  const eaten = useMemo(() => Math.min(targetCal, 350 + phase * 120), [phase]);
  const left = Math.max(0, targetCal - eaten);
  const pct = eaten / targetCal;
  const completed = eaten >= targetCal * 0.9;

  /* Animated macro leftovers — tick down as meals are "logged" */
  const cLeft = useMemo(() => Math.max(0, 51 - phase * 6), [phase]);
  const pLeft = useMemo(() => Math.max(0, 22 - phase * 2), [phase]);
  const fLeft = useMemo(() => Math.max(0, 19 - phase * 2), [phase]);

  /* Visible meals — newest at top. Pool rotates so the demo loops
   * through different foods without growing unbounded. */
  const visibleMeals = useMemo(() => {
    const count = Math.min(phase + 1, 3);
    const pool = MEAL_DEMO_POOL;
    return Array.from(
      { length: count },
      (_, i) => pool[(phase + i) % pool.length],
    );
  }, [phase]);

  /* Cycle the active day on the strip every 4 phases — gives the
   * "clicking a day actually does something" feel without conflicting
   * with manual user clicks (manual click wins until the next cycle). */
  useEffect(() => {
    if (phase === 0) return;
    if (phase % 4 === 0) {
      setActiveDay((d) => (d + 1) % WEEK_DAYS.length);
    }
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl flex text-white"
      role="img"
      aria-label="Live preview of the CalStory dashboard"
      style={{ background: "#0a0a0a" }}>
      <Sidebar activeKey={activeNav} onSelect={setActiveNav} />

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        <TopBar
          activeDayIndex={activeDay}
          onDayChange={setActiveDay}
          streak={5}
        />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4 h-64">
          <CaloriesCard left={left} completed={completed} pct={pct} />

          <div className="flex flex-col gap-2 min-w-0 md:h-64">
            <MacroCard
              emoji="🥦"
              color="#34d399"
              label="Carbs"
              value={cLeft}
              unit="g"
            />
            <MacroCard
              emoji="🍗"
              color="#f87171"
              label="Protein"
              value={pLeft}
              unit="g"
            />
            <MacroCard
              emoji="🥑"
              color="#facc15"
              label="Fats"
              value={fLeft}
              unit="g"
            />
          </div>
        </div>

        <div className="flex flex-1 md:flex-1 gap-3 px-3 sm:px-4 pb-14 sm:pb-4 relative">
          {/* Workout */}
          <section className="flex-1 basis-1/2 min-w-0">
            <div className="flex w-full items-center justify-between mb-2 px-1">
              <span className="text-[12px] font-bold text-white">
                Today's Workout
              </span>
              <button
                type="button"
                className="text-[10.5px] font-semibold text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer">
                See all <ArrowUpRight size={10} />
              </button>
            </div>
            <div
              className={`${SURFACE} ${BORDER} rounded-2xl px-3 py-3 flex items-center gap-3 ${SURFACE_HOVER} transition-colors cursor-pointer`}>
              <div className="w-9 h-9 rounded-xl bg-white/5 grid place-items-center text-base shrink-0">
                <span aria-hidden>{WORKOUT_DEMO.emoji}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-white truncate">
                  {WORKOUT_DEMO.name}
                </div>
                <div className="text-[11px] text-white/40">
                  {WORKOUT_DEMO.subtitle}
                </div>
              </div>
            </div>
          </section>

          {/* Recently uploaded */}
          <section className="flex-1 basis-1/2 min-w-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[12px] font-bold text-white">
                Recently uploaded
              </span>
              <button
                type="button"
                className="text-[10.5px] font-semibold text-white/40 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer">
                See all <ArrowUpRight size={10} />
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
                    <MealRow meal={m} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
        {/* FAB */}
        <Fab />
      </div>
    </div>
  );
}

export default DashboardMock;
