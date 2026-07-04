"use client";

/**
 * FastingRing — circular SVG progress ring for the fasting tracker.
 *
 * Animates via CSS stroke-dashoffset so it works without Framer Motion.
 * Accepts a 0-1 progress value; all time labels are pre-formatted by
 * the useFastingTimer hook (UTC-correct arithmetic).
 */

import { type ReactNode } from "react";

interface FastingRingProps {
  /** 0 – 1 */
  progress: number;
  elapsedLabel: string;
  remainingLabel: string;
  targetLabel: string;
  isComplete: boolean;
  /** Optional center content (overrides default labels) */
  center?: ReactNode;
  /** Ring size in px. Default 240. */
  size?: number;
  /** Ring stroke width. Default 14. */
  strokeWidth?: number;
}

export default function FastingRing({
  progress,
  elapsedLabel,
  remainingLabel,
  targetLabel,
  isComplete,
  center,
  size = 240,
  strokeWidth = 14,
}: FastingRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress));

  // Color ramps: green fill as fast progresses, purple on complete
  const trackColor = "var(--color-border, #e5e7eb)";
  const fillColor = isComplete
    ? "oklch(0.5854 0.2041 296.3619)" // purple
    : progress > 0.75
      ? "oklch(0.6271 0.1699 149.2138)" // deeper green
      : "oklch(0.7227 0.192 149.5793)"; // primary green

  return (
    <div
      className="flex flex-col items-center gap-3 select-none"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Fasting progress: ${Math.round(progress * 100)}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.6s ease",
            }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
          style={{ transform: "rotate(0deg)" }}
        >
          {center ?? (
            <>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                elapsed
              </span>
              <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {elapsedLabel}
              </span>
              {isComplete ? (
                <span className="text-xs font-bold text-purple-500 mt-0.5">
                  Goal reached! 🎉
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {remainingLabel} left
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Below ring: target label */}
      <p className="text-xs text-muted-foreground">
        Target: <span className="font-semibold text-foreground">{targetLabel}</span>
      </p>
    </div>
  );
}
