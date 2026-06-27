"use client";

import { Card } from "@/app/components/ui/card";
import { useApp, todayLocalKey } from "@/app/context/AppContext";

interface Props {
  eaten: number;
  target: number;
}

export default function CalorieHero({ eaten, target }: Props) {
  const { state } = useApp();
  const left = Math.max(0, target - eaten);
  const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
  const over = target > 0 && eaten > target;
  const hasTarget = target > 0;

  const isPastDay = state.selDate < todayLocalKey();

  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct);

  let statusText = "Set a target";
  if (over) {
    statusText = `Over by ${(eaten - target).toLocaleString()} kcal`;
  } else if (hasTarget) {
    if (left === 0) {
      statusText = "Goal reached!";
    } else if (isPastDay) {
      statusText = "Day completed";
    } else if (eaten === 0) {
      statusText = "Ready to start tracking";
    } else {
      statusText = "You are on track";
    }
  }

  return (
    <Card className="flex items-center justify-between px-4 sm:px-6 py-5 h-full min-w-0 overflow-hidden">
      {/* ── Left: stat ── */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-[44px] font-extrabold leading-none tracking-tight text-foreground dark:text-foreground tabular-nums truncate pr-2  ">
          {left.toLocaleString()}
        </div>
        <div className="text-[13px] font-semibold text-muted-foreground mt-1 mb-3 truncate">
          Calories Left
        </div>
        <div
          className={[
            "inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full max-w-full",
            over
              ? "bg-red-50 text-red-600"
              : hasTarget
                ? "bg-emerald-50 text-emerald-600"
                : "bg-foreground/5 text-muted-foreground",
          ].join(" ")}>
          <span
            className={[
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              over
                ? "bg-red-400"
                : hasTarget
                  ? "bg-emerald-500"
                  : "bg-muted-foreground",
            ].join(" ")}
          />
          <span className="truncate">{statusText}</span>
        </div>
      </div>

      {/* ── Right: ring ── */}
      <div className="relative flex-shrink-0 w-[88px] sm:w-[110px] md:w-[140px] lg:w-[170px] xl:w-[200px] h-[88px] sm:h-[110px] md:h-[140px] lg:h-[170px] xl:h-[200px]">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 180 180"
          className={over ? "animate-pulse" : ""}>
          {/* Start the ring at 12 o'clock and go clockwise */}
          <g transform="rotate(-90 90 90)">
            {/* Track — full circle, light grey */}
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              className="stroke-border dark:stroke-border"
              strokeWidth="12"
            />
            {/* Progress — same full circle, but shortened by offset */}
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={over ? "var(--color-red)" : "currentColor"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              className={`ring-arc transition-all duration-1000 ease-out ${over ? "" : "text-foreground"}`}
            />
          </g>
        </svg>
        {/* centre glyph */}
        <div className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl select-none pointer-events-none">
          🔥
        </div>
      </div>
    </Card>
  );
}
