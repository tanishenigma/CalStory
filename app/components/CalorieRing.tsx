'use client';

import type { Meal } from '@/app/types';
import { useApp } from '@/app/context/AppContext';

const CIRCUMFERENCE = 2 * Math.PI * 72; // r = 72

export default function CalorieRing() {
  const { state } = useApp();
  const profile   = state.profile;
  const meals: Meal[] = state.meals[state.selDate] || [];
  const eaten     = meals.reduce((s, m) => s + (m.cal || 0), 0);
  const target    = profile?.calTarget ?? 0;
  const pct       = target > 0 ? Math.min(eaten / target, 1) : 0;
  const offset    = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 170 170" className="-rotate-90">
        {/* track */}
        <circle
          cx="85" cy="85" r="72"
          fill="none" stroke="var(--color-border)" strokeWidth="10"
        />
        {/* progress arc */}
        <circle
          cx="85" cy="85" r="72"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="ring-arc"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-3xl font-bold text-foreground leading-none">{eaten}</div>
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5">kcal eaten</div>
        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">of {target} kcal</div>
      </div>
    </div>
  );
}
