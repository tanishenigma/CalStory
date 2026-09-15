"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Droplets, GlassWater, Settings2, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { displayVolume } from "@/app/lib/units";
import type { VolumeUnit, HydrationEntry } from "@/app/types";

interface HydrationBarProps {
  totalMl: number;
  goalMl: number;
  pct: number;
  entries: HydrationEntry[];
  volumeUnit: VolumeUnit;
  onAdd: (ml: number) => void;
  onRemove: (id: string) => void;
  onSetGoal: (ml: number) => void;
}

const QUICK_ADDS_ML = [150, 250, 500, 1000];
const MANUAL_ADD_MIN_ML = 1;
const MANUAL_ADD_MAX_ML = 5000;
const GOAL_MIN_ML = 500;
const GOAL_MAX_ML = 10000;

export default function HydrationBar({
  totalMl,
  goalMl,
  pct,
  entries,
  volumeUnit,
  onAdd,
  onRemove,
  onSetGoal,
}: HydrationBarProps) {
  const [manualInput, setManualInput] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goalMl));
  const [isLogExpanded, setIsLogExpanded] = useState(false);

  useEffect(() => {
    if (!editGoal) {
      setGoalInput(String(goalMl));
    }
  }, [goalMl, editGoal]);

  function handleManualAdd() {
    const val = parseInt(manualInput.trim(), 10);
    if (!isNaN(val) && val > 0 && val <= MANUAL_ADD_MAX_ML) {
      onAdd(val);
      setManualInput("");
    }
  }

  function handleGoalSave() {
    const val = parseInt(goalInput.trim(), 10);
    if (!isNaN(val) && val >= GOAL_MIN_ML && val <= GOAL_MAX_ML) {
      onSetGoal(val);
      setEditGoal(false);
    }
  }

  function handleEditToggle() {
    if (editGoal) {
      setGoalInput(String(goalMl));
    }
    setEditGoal((p) => !p);
  }

  const fillPct = Math.round(pct * 100);

  return (
    <div className="flex flex-col gap-6 rounded-[1.75rem] border border-border bg-card p-5 text-foreground shadow-[0_20px_60px_oklch(0_0%_0%_/_0.12)] sm:p-7 dark:shadow-[0_20px_60px_oklch(0_0%_0%_/_0.24)]">
      {/* Header and progress */}
      <div className="relative">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-500 dark:text-blue-400">
              <Droplets size={25} />
            </div>
            <div className="ml-2">
              <p className="text-xl font-bold tracking-tight">Hydration</p>
              <p className="text-sm text-muted-foreground">Keep going. Small sips add up.</p>
            </div>
          </div>
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-blue-400/50 hover:text-foreground"
            aria-label="Edit hydration goal">
            <Settings2 size={17} />
            {editGoal ? "Cancel" : "Edit goal"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {editGoal && (
            <motion.div
              initial={{ opacity: 0, transform: "translateY(-8px)" }}
              animate={{ opacity: 1, transform: "translateY(0)" }}
              exit={{ opacity: 0, transform: "translateY(-6px)" }}
              transition={{ duration: 0.2, ease: [0.165, 0.84, 0.44, 1] }}
              className="mb-5 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Daily goal
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {displayVolume(Number(goalInput) || GOAL_MIN_ML, volumeUnit)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoalSave}
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95">
                  Save
                </button>
              </div>
              <input
                type="range"
                value={Math.min(
                  GOAL_MAX_ML,
                  Math.max(GOAL_MIN_ML, Number(goalInput) || GOAL_MIN_ML),
                )}
                onChange={(e) => setGoalInput(e.target.value)}
                min={GOAL_MIN_ML}
                max={GOAL_MAX_ML}
                step={100}
                className="h-2 w-full cursor-pointer accent-blue-500"
                aria-label="Daily hydration goal"
                aria-valuetext={`${displayVolume(Number(goalInput) || GOAL_MIN_ML, volumeUnit)} per day`}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{displayVolume(GOAL_MIN_ML, volumeUnit)}</span>
                <span>{displayVolume(GOAL_MAX_ML, volumeUnit)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated progress bar */}
        <div className="flex items-center gap-4">
        <div
          className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={fillPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Hydration: ${fillPct}% of daily goal`}>
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${fillPct}%`,
              backgroundColor: "#3b9cff",
              opacity: 1,
            }}
          />
        </div>
        <span className="shrink-0 text-2xl font-bold tabular-nums text-blue-400">{fillPct}%</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
          <span className="block text-3xl font-bold tabular-nums">
            {displayVolume(totalMl, volumeUnit)}
          </span>
          <span className="text-base text-muted-foreground">
            of {displayVolume(goalMl, volumeUnit)}
          </span>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
            <Trophy size={17} className="text-blue-400" />
            {displayVolume(Math.max(0, goalMl - totalMl), volumeUnit)} to go
          </span>
        </div>
      </div>

      {/* Quick-add buttons */}
      <div>
      <p className="mb-3 text-base font-semibold text-foreground/80">Quick add</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ADDS_ML.map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(ml)}
            id={`hydration-quick-add-${ml}`}
            className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border border-border bg-transparent px-3 py-3 text-sm font-semibold transition-colors hover:border-blue-400 hover:bg-blue-400/10"
            aria-label={`Add ${displayVolume(ml, volumeUnit)}`}>
            <GlassWater size={25} className="text-muted-foreground" />
            +{displayVolume(ml, volumeUnit)}
          </button>
        ))}
      </div>
      </div>

      {/* Bottom activity stack — expands like Today's Meals on hover/focus. */}
      <div
        className="group relative max-h-[76px] overflow-hidden rounded-2xl border border-border transition-[max-height] duration-300 ease-out focus-within:max-h-[32rem] hover:max-h-[32rem]"
        style={isLogExpanded ? { maxHeight: 512 } : undefined}
        >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsLogExpanded((expanded) => !expanded)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsLogExpanded((expanded) => !expanded);
            }
          }}
          className="flex min-h-[76px] w-full cursor-pointer items-center justify-between gap-4 px-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:px-6"
          aria-expanded={isLogExpanded}
          aria-controls="hydration-log-details">
          <span className="flex items-center gap-3 text-left">
            <GlassWater size={23} className="text-blue-400" />
            <span>
              <span className="block text-base font-bold">Today&apos;s Log</span>
              <span className="block text-xs text-muted-foreground">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="text-xl font-bold tabular-nums">{displayVolume(totalMl, volumeUnit)}</span>
            <motion.button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (manualInput.trim()) {
                  handleManualAdd();
                } else {
                  setIsLogExpanded(true);
                }
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white opacity-100 transition-opacity sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Add custom hydration amount">
              <Plus size={24} />
            </motion.button>
          </span>
        </div>

        <div id="hydration-log-details" className="space-y-3 px-4 pb-4 sm:px-6">
          <div className="flex gap-3">
            <input
              type="number"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
              placeholder="Enter custom amount (ml)"
              min={MANUAL_ADD_MIN_ML}
              max={MANUAL_ADD_MAX_ML}
              className="min-h-14 flex-1 rounded-2xl border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              aria-label="Custom amount in ml"
              id="hydration-manual-input"
            />
          </div>

          {entries.length > 0 && (
            <div className="max-h-0 -translate-y-2 overflow-hidden rounded-2xl border border-border px-4 opacity-0 transition-[max-height,opacity,transform] duration-250 ease-out group-hover:max-h-96 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:max-h-96 group-focus-within:translate-y-0 group-focus-within:opacity-100 sm:px-6">
              {[...entries]
                .sort((a, b) => b.loggedAt - a.loggedAt)
                .slice(0, 5)
                .map((e) => (
                  <div
                    key={e.id}
                    className="group flex items-center justify-between border-b border-border py-4 last:border-0">
                    <span className="flex items-center gap-4 text-base">
                      <GlassWater size={23} className="text-muted-foreground" />
                      {displayVolume(e.ml, volumeUnit)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(e.loggedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <button
                        onClick={() => onRemove(e.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-400 hover:text-red-400"
                        aria-label="Remove entry">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
