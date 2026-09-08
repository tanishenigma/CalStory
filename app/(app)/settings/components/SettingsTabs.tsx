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
    <div className="flex gap-1 p-1 bg-card rounded-xl overflow-x-auto">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;

        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative flex-1 min-w-17.5 min-h-11 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
              isActive
                ? "text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {isActive && (
              <motion.div
                layoutId="active-settings-tab"
                layout="position"
                className="absolute inset-0 bg-foreground rounded-lg shadow-sm"
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 42,
                }}
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
