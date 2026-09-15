"use client";

import { Dumbbell, Droplets, Flame, Wheat } from "lucide-react";

interface Props {
  macros: { cal: number; p: number; c: number; f: number };
  target: { cal: number; p: number; c: number; f: number };
}

type TargetRow = {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  Icon: typeof Wheat;
  color: string;
  iconClass: string;
};

function TargetProgress({ row }: { row: TargetRow }) {
  const ratio = row.target > 0 ? row.consumed / row.target : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/45 px-3 py-2.5 dark:bg-white/[0.035]">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${row.iconClass}`}>
        <row.Icon size={17} strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-foreground">{row.label}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {row.consumed} / {row.target} {row.unit}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted dark:bg-white/[0.12]">
          <div
            className={`h-full rounded-full ${row.color}`}
            style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
          />
        </div>
      </div>

      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {percent}%
      </span>
    </div>
  );
}

export default function MacroPills({ macros, target }: Props) {
  const rows: TargetRow[] = [
    {
      label: "Carbohydrates",
      consumed: macros.c,
      target: target.c,
      unit: "g",
      Icon: Wheat,
      color: "bg-green-500",
      iconClass: "bg-green-500/15 text-green-500",
    },
    {
      label: "Protein",
      consumed: macros.p,
      target: target.p,
      unit: "g",
      Icon: Dumbbell,
      color: "bg-red-500",
      iconClass: "bg-red-500/15 text-red-500",
    },
    {
      label: "Fats",
      consumed: macros.f,
      target: target.f,
      unit: "g",
      Icon: Droplets,
      color: "bg-yellow-500",
      iconClass: "bg-yellow-500/15 text-yellow-500",
    },
    {
      label: "Energy",
      consumed: macros.cal,
      target: target.cal,
      unit: "kcal",
      Icon: Flame,
      color: "bg-blue-500",
      iconClass: "bg-blue-500/15 text-blue-500",
    },
  ];

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Macronutrient Targets
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Consumed / Target
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
        {rows.map((row) => (
          <TargetProgress key={row.label} row={row} />
        ))}
      </div>
    </div>
  );
}
