"use client";

import type { Meal } from "@/app/types";
import { useApp } from "@/app/context/AppContext";

interface MacroDef {
  n: string;
  k: keyof EatenMacros;
  target: "protein" | "carbs" | "fat";
  col: string;
}

interface EatenMacros {
  p: number;
  c: number;
  f: number;
}

const MACROS: MacroDef[] = [
  { n: "Protein", k: "p", target: "protein", col: "oklch(0.6271 0.1699 149.2138)" },
  { n: "Carbs", k: "c", target: "carbs", col: "var(--color-primary)" },
  { n: "Fat", k: "f", target: "fat", col: "oklch(0.7951 0.1841 84.4000)" },
];

export default function MacroBars() {
  const { state } = useApp();
  const profile = state.profile;
  const meals: Meal[] = state.meals[state.selDate] || [];

  const eaten: EatenMacros = { p: 0, c: 0, f: 0 };
  meals.forEach((m) => {
    eaten.p += m.p || 0;
    eaten.c += m.c || 0;
    eaten.f += m.f || 0;
  });

  return (
    <div className="w-full flex-1 flex flex-col gap-4">
      {MACROS.map(({ n, k, target, col }) => {
        const t = profile?.[target] ?? 0;
        const val = eaten[k];
        const pct = t > 0 ? Math.min((val / t) * 100, 100) : 0;
        return (
          <div className="flex flex-col gap-1.5" key={k}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                {n}
              </span>
              <span className="font-mono text-foreground font-bold">
                {val}
                <span className="text-muted-foreground font-normal text-[11px]">
                  /{t}g
                </span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: col }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
