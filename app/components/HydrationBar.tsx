"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Droplets } from "lucide-react";
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
  goalReached: boolean;
}

const QUICK_ADDS_ML = [150, 250, 500];
const MANUAL_ADD_MIN_ML = 1;
const MANUAL_ADD_MAX_ML = 5000;
const GOAL_MIN_ML = 0;
const GOAL_MAX_ML = 10000;
const HYDRATION_FILL_COLOR = "oklch(0.7154 0.1389 235.0437)"; // cyan

export default function HydrationBar({
  totalMl,
  goalMl,
  pct,
  entries,
  volumeUnit,
  onAdd,
  onRemove,
  onSetGoal,
  goalReached,
}: HydrationBarProps) {
  const [manualInput, setManualInput] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goalMl));

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
    <div className="flex flex-col gap-4">
      {/* Progress fill bar */}
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Droplets size={15} className="text-cyan-500" />
            <span className="text-sm font-bold text-foreground">Hydration</span>
            {goalReached && (
              <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400 rounded-full px-2 py-0.5">
                Goal reached! <span aria-hidden="true">💧</span>
              </span>
            )}
          </div>
          <button
            onClick={handleEditToggle}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit hydration goal">
            {editGoal ? "cancel" : "edit goal"}
          </button>
        </div>

        {editGoal && (
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Goal in ml"
              min={GOAL_MIN_ML}
              max={GOAL_MAX_ML}
              aria-label="Daily goal in ml"
            />
            <button
              onClick={handleGoalSave}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity">
              Save
            </button>
          </div>
        )}

        {/* Animated progress bar */}
        <div
          className="w-full h-3 rounded-full bg-border overflow-hidden"
          role="progressbar"
          aria-valuenow={fillPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Hydration: ${fillPct}% of daily goal`}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${fillPct}%`,
              backgroundColor: HYDRATION_FILL_COLOR,
              opacity: goalReached ? 1 : 0.7 + pct * 0.3,
            }}
          />
        </div>

        <div className="flex justify-between items-center mt-1.5">
          <span className="text-sm font-bold text-foreground tabular-nums">
            {displayVolume(totalMl, volumeUnit)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {displayVolume(goalMl, volumeUnit)} ({fillPct}%)
          </span>
        </div>
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2">
        {QUICK_ADDS_ML.map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(ml)}
            id={`hydration-quick-add-${ml}`}
            className="flex-1 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-400 transition-colors"
            aria-label={`Add ${displayVolume(ml, volumeUnit)}`}>
            +{displayVolume(ml, volumeUnit)}
          </button>
        ))}
      </div>

      {/* Manual entry */}
      <div className="flex gap-2">
        <input
          type="number"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
          placeholder="Custom ml"
          min={MANUAL_ADD_MIN_ML}
          max={MANUAL_ADD_MAX_ML}
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Custom amount in ml"
          id="hydration-manual-input"
        />
        <button
          onClick={handleManualAdd}
          className="px-3 py-2 rounded-xl bg-foreground text-background hover:opacity-85 transition-opacity"
          aria-label="Add custom amount"
          id="hydration-manual-add">
          <Plus size={16} />
        </button>
      </div>

      {/* Entry log — last 5 entries */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
            Today's log
          </p>
          {[...entries]
            .sort((a, b) => b.loggedAt - a.loggedAt)
            .slice(0, 5)
            .map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-subtle transition-colors group">
                <span className="text-sm text-foreground">
                  {displayVolume(e.ml, volumeUnit)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(e.loggedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={() => onRemove(e.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                    aria-label="Remove entry">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
