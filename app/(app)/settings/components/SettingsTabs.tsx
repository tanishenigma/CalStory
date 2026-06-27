"use client";

import { motion } from "framer-motion";
import type { Tab } from "./types";

interface SettingsTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  tabs: { key: Tab; label: string }[];
}

export function SettingsTabs({ active, onChange, tabs }: SettingsTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted-foreground/20 dark:bg-muted-foreground/20 rounded-xl overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative flex-1 min-w-[70px] px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
            active === t.key
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground dark:hover:text-foreground"
          }`}>
          {active === t.key && (
            <motion.div
              layoutId="active-settings-tab"
              className="absolute inset-0 bg-card rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            />
          )}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
