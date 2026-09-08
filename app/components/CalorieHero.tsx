"use client";

import { Card } from "@/app/components/ui/card";
import { useApp, todayLocalKey } from "@/app/context/AppContext";
import { Flame } from "lucide-react";

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
                ? "bg-amber-50 text-amber-600"
                : "bg-foreground/5 text-muted-foreground",
          ].join(" ")}>
          <span
            className={[
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              over
                ? "bg-red-400"
                : hasTarget
                  ? "bg-amber-500"
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
          {/* Gradient for progress arc */}
          <defs>
            <linearGradient
              id="flameProgressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>

          {/* Start the ring at 12 o'clock and go clockwise */}
          <g transform="rotate(-90 90 90)">
            {/* Track */}
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              className="stroke-border dark:stroke-border"
              strokeWidth="12"
            />

            {/* Progress */}
            <circle
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={over ? "var(--color-red)" : "url(#flameProgressGradient)"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              className="ring-arc transition-all duration-1000 ease-out"
            />
          </g>
        </svg>
        {/* centre glyph */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
          <Flame className="size-[45%] max-w-40 max-h-40 fill-orange-400 stroke-0" />
        </div>
      </div>
    </Card>
  );
}
