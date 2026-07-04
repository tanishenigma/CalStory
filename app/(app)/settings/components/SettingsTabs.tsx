"use client";

import { motion } from "framer-motion";
import type { Tab } from "./types";
import type { LucideIcon } from "lucide-react";

interface SettingsTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  tabs: { key: Tab; label: string; icon: LucideIcon }[];
}

export function SettingsTabs({ active, onChange, tabs }: SettingsTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted-foreground/20 dark:bg-muted-foreground/20 rounded-xl overflow-x-auto">
      {tabs.map((t) => {
        const Icon = t.icon;

        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative flex-1 min-w-17.5 min-h-11 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
              active === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground dark:hover:text-foreground"
            }`}>
            {active === t.key && (
              <motion.div
                layoutId="active-settings-tab"
                layout="position"
                className="absolute inset-0 bg-card rounded-lg shadow-sm"
                style={{ width: "100%", height: "100%" }}
                /* Overdamped spring (damping ratio ≈ 1.2) so the
                 * active pill slides between tabs without the
                 * visible overshoot/wobble that an underdamped
                 * spring produces on long-distance `layoutId`
                 * transitions. Snappiness is preserved by the high
                 * stiffness. */
                transition={{ type: "spring", stiffness: 320, damping: 42 }}
              />
            )}

            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Icon size={20} />
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
