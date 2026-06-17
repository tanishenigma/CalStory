"use client";

import { useApp } from "@/app/context/AppContext";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  macros: { p: number; c: number; f: number };
  target: { p: number; c: number; f: number };
}

function MeterRing({
  pct,
  colorClass,
  children,
}: {
  pct: number;
  colorClass: string;
  children: React.ReactNode;
}) {
  const R = 14;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.min(pct, 1));

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        className="absolute inset-0 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          className="stroke-[#F0EFEC] dark:stroke-[#3a3a3a]"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          className={colorClass}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="z-10 text-sm">{children}</div>
    </div>
  );
}

export default function MacroPills({ macros, target }: Props) {
  const cLeft = Math.max(0, target.c - macros.c);
  const pLeft = Math.max(0, target.p - macros.p);
  const fLeft = Math.max(0, target.f - macros.f);

  const cPct = target.c > 0 ? macros.c / target.c : 0;
  const pPct = target.p > 0 ? macros.p / target.p : 0;
  const fPct = target.f > 0 ? macros.f / target.f : 0;

  return (
    <div className="flex flex-col gap-3 h-full min-w-0">
      {/* Carbs Pill */}
      <Link
        href="/nutrition"
        className="flex-1 min-w-0 bg-card rounded-[24px] px-4 sm:px-5 py-4 flex items-center justify-between border border-[#F0EFEC] dark:border-[#2a2a2a] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-50/50 flex items-center justify-center relative shrink-0">
            <MeterRing pct={cPct} colorClass="text-emerald-500">
              🥦
            </MeterRing>
          </div>
          <span className="text-[14px] font-bold text-[#1A1916] dark:text-[#f7f6f3] truncate">
            {cLeft}g Carbs Left
          </span>
        </div>
        <ChevronRight size={16} className="text-[#9B9895] shrink-0 ml-2" />
      </Link>

      {/* Protein Pill */}
      <Link
        href="/nutrition"
        className="flex-1 min-w-0 bg-card rounded-[24px] px-4 sm:px-5 py-4 flex items-center justify-between border border-[#F0EFEC] dark:border-[#2a2a2a] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-red-50/50 flex items-center justify-center relative shrink-0">
            <MeterRing pct={pPct} colorClass="text-red-500">
              🥩
            </MeterRing>
          </div>
          <span className="text-[14px] font-bold text-[#1A1916] dark:text-[#f7f6f3] truncate">
            {pLeft}g Protein Left
          </span>
        </div>
        <ChevronRight size={16} className="text-[#9B9895] shrink-0 ml-2" />
      </Link>

      {/* Fat Pill */}
      <Link
        href="/nutrition"
        className="flex-1 min-w-0 bg-card rounded-[24px] px-4 sm:px-5 py-4 flex items-center justify-between border border-[#F0EFEC] dark:border-[#2a2a2a] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-yellow-50/50 flex items-center justify-center relative shrink-0">
            <MeterRing pct={fPct} colorClass="text-yellow-500">
              🥑
            </MeterRing>
          </div>
          <span className="text-[14px] font-bold text-[#1A1916] dark:text-[#f7f6f3] truncate">
            {fLeft}g Fats Left
          </span>
        </div>
        <ChevronRight size={16} className="text-[#9B9895] shrink-0 ml-2" />
      </Link>
    </div>
  );
}
