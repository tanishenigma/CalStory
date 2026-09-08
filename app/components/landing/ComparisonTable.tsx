"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Minus, X } from "lucide-react";

type CellValue = "yes" | "partial" | "no";

interface Feature {
  label: string;
  note?: string;
  calstory: CellValue;
  manual: CellValue;
  aiWrapper: CellValue;
}

// Honest comparison: CalStory vs. manual tracking vs. typical fitness apps
// Differentiators: adaptive TDEE, full strength logging, streak heatmap, data export, no ads.
const FEATURES: Feature[] = [
  {
    label: "AI plain-English meal logging",
    calstory: "yes",
    manual: "no",
    aiWrapper: "partial",
    note: "Many apps have basic food search; CalStory parses full natural-language descriptions via Gemini",
  },
  {
    label: "Strength training (sets × reps × kg)",
    calstory: "yes",
    manual: "partial",
    aiWrapper: "partial",
    note: "Most AI-focused food trackers have limited or no strength logging",
  },
  {
    label: "Adaptive TDEE (adjusts from your actual weight trend)",
    calstory: "yes",
    manual: "no",
    aiWrapper: "no",
    note: "CalStory recalculates weekly based on logged weight — not a one-time formula",
  },
  {
    label: "Macro targets (protein / carbs / fat)",
    calstory: "yes",
    manual: "partial",
    aiWrapper: "partial",
  },
  {
    label: "16-week consistency heatmap",
    calstory: "yes",
    manual: "no",
    aiWrapper: "no",
  },
  {
    label: "Weight trend tracking",
    calstory: "yes",
    manual: "partial",
    aiWrapper: "partial",
  },
  {
    label: "Workout templates / re-log with previous weights",
    calstory: "yes",
    manual: "no",
    aiWrapper: "no",
  },
  {
    label: "No ads in-app",
    calstory: "yes",
    manual: "yes",
    aiWrapper: "partial",
    note: "Many free-tier fitness apps show ads",
  },
  {
    label: "Free tier — no credit card required",
    calstory: "yes",
    manual: "yes",
    aiWrapper: "partial",
  },
  {
    label: "Data export (CSV / JSON)",
    calstory: "yes",
    manual: "yes",
    aiWrapper: "partial",
    note: "CalStory export available on Pro; manual tracking always exportable by definition",
  },
];

const HEADERS = [
  { key: "calstory" as const, label: "CalStory", highlight: true },
  { key: "manual" as const, label: "Manual tracking", highlight: false },
  { key: "aiWrapper" as const, label: "Other fitness apps", highlight: false },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "yes")
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
        </div>
      </div>
    );
  if (value === "partial")
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-amber/15 flex items-center justify-center">
          <Minus className="w-3.5 h-3.5 text-amber" strokeWidth={2.5} />
        </div>
      </div>
    );
  return (
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full bg-red/10 flex items-center justify-center">
        <X className="w-3.5 h-3.5 text-red" strokeWidth={2.5} />
      </div>
    </div>
  );
}

export default function ComparisonTable() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  const EASE = [0.16, 1, 0.3, 1] as const;

  return (
    <section
      ref={ref}
      id="comparison"
      aria-labelledby="comparison-heading"
      className="relative z-10 py-24 px-4 w-full">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            Comparison
          </span>
          <h2
            id="comparison-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight leading-tight font-heading">
            CalStory vs. what you&apos;ve{" "}
            <span className="text-primary">already tried</span>.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
            How CalStory compares to tracking in a spreadsheet and typical
            fitness apps.
            <span className="text-amber font-medium"> Partial</span> = available
            but limited or gated.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 pl-6 font-semibold text-muted-foreground w-[42%]">
                  Feature
                </th>
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={`p-4 text-center font-bold text-sm ${
                      h.highlight
                        ? "text-primary bg-primary/5"
                        : "text-foreground"
                    }`}>
                    {h.highlight && (
                      <div className="text-[10px] font-black tracking-widest uppercase text-primary/60 mb-1">
                        ← Best choice
                      </div>
                    )}
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f.label}
                  className={`border-b border-border/60 last:border-0 ${
                    i % 2 === 0 ? "bg-background" : "bg-card/50"
                  }`}>
                  <td className="p-4 pl-6">
                    <div className="font-medium text-foreground">{f.label}</div>
                    {f.note && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {f.note}
                      </div>
                    )}
                  </td>
                  {HEADERS.map((h) => (
                    <td
                      key={h.key}
                      className={`p-4 ${h.highlight ? "bg-primary/[0.03]" : ""}`}>
                      <Cell value={f[h.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-5">
          Based on publicly available feature documentation for each category.
          &ldquo;Other fitness apps&rdquo; reflects typical patterns —
          individual apps vary.
        </motion.p>
      </div>
    </section>
  );
}
