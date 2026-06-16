"use client";

import { Card } from "@/app/components/ui/card";
import { useApp, todayKey } from "@/app/context/AppContext";

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

  const isPastDay = state.selDate < todayKey();

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
    <Card className="flex items-center justify-between px-6 py-5 h-full">
      {/* ── Left: stat ── */}
      <div>
        <div className="text-[44px] font-extrabold leading-none tracking-tight text-[#1A1916] dark:text-[#f7f6f3] tabular-nums">
          {left.toLocaleString()}
        </div>
        <div className="text-[13px] font-semibold text-[#9B9895] mt-1 mb-3">
          Calories Left
        </div>
        <div
          className={[
            "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full",
            over
              ? "bg-red-50 text-red-600"
              : hasTarget
                ? "bg-emerald-50 text-emerald-600"
                : "bg-foreground/5 text-muted-foreground-foreground",
          ].join(" ")}>
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              over
                ? "bg-red-400"
                : hasTarget
                  ? "bg-emerald-500"
                  : "bg-muted-foreground",
            ].join(" ")}
          />
          {statusText}
        </div>
      </div>

      {/* ── Right: ring ── */}
      <div className="relative flex-shrink-0 w-[110px] h-[110px]">
        <svg
          width="110"
          height="110"
          viewBox="0 0 130 130"
          className={over ? "animate-pulse" : ""}>
          {/* Start the ring at 12 o'clock and go clockwise */}
          <g transform="rotate(-90 65 65)">
            {/* Track — full circle, light grey */}
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              className="stroke-[#F0EFEC] dark:stroke-[#3a3a3a]"
              strokeWidth="12"
            />
            {/* Progress — same full circle, but shortened by offset */}
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              stroke={over ? "#EF4444" : "currentColor"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              className={`ring-arc transition-all duration-1000 ease-out ${over ? "" : "text-[#1A1916] dark:text-[#f7f6f3]"}`}
            />
          </g>
        </svg>
        {/* centre glyph */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl select-none pointer-events-none">
          🔥
        </div>
      </div>
    </Card>
  );
}
