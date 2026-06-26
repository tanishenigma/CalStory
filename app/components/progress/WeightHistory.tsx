"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import { useApp } from "@/app/context/AppContext";
import { useToast } from "@/app/components/ToastContainer";
import { kgToLbs, lbsToKg } from "@/app/lib/units";
import type { WeightLog } from "@/app/types";

const MAX_NOTE = 80;

function formatDate(d: string): string {
  // `date` is YYYY-MM-DD; parse as local-noon to dodge TZ shifts
  // that would roll a "today" entry into yesterday.
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Weight log history + a "log new weigh-in" inline form.
 *
 * The form mirrors the data: on save it calls `logWeight` from
 * the context, which writes a `WeightLog` doc *and* updates
 * `profile.weight`. That single round-trip is what powers the
 * settings ↔ progress sync — the settings page reads the same
 * `profile.weight` and shows the new value with no extra work.
 */
export function WeightHistory() {
  const { state, logWeight, deleteWeightLog } = useApp();
  const toast = useToast();
  const profile = state?.profile;
  const logs = state?.weightLogs ?? [];

  const [adding, setAdding] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // When the user opens the form, prefill with the latest weight
  // in the unit they prefer. They can then tweak the number, change
  // the date, or skip it (e.g. just correcting a typo) and save.
  useEffect(() => {
    if (!adding || !profile) return;
    const initial =
      profile.weightUnit === "lbs" ? kgToLbs(profile.weight) : profile.weight;
    setWeightInput(String(initial));
  }, [adding, profile]);

  const weightUnit = profile?.weightUnit ?? "kg";

  async function handleSave() {
    if (saving) return;
    const num = Number(weightInput);
    if (!Number.isFinite(num) || num <= 0) {
      toast("Enter a valid weight", "⚠️");
      return;
    }
    const weightKg = weightUnit === "lbs" ? lbsToKg(num) : num;
    setSaving(true);
    const result = await logWeight(weightKg, weightUnit, {
      date,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (result) {
      toast("Weigh-in logged ✓");
      setAdding(false);
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
    } else {
      toast("Could not log weigh-in", "⚠️");
    }
  }

  async function handleDelete(id: string) {
    await deleteWeightLog(id);
    toast("Removed");
  }

  // Display helper: show each entry in the user's *current* global
  // unit (profile.weightUnit), not the unit they happened to be
  // in when they logged that row. The WeightLog stores its own
  // unit because that's what the user typed, but a paper log
  // shows the same number regardless of what unit you happen
  // to prefer today — so should we. We always store kg internally
  // (`log.weight` is in kg) and convert at display time using the
  // current global setting.
  function displayWeight(log: WeightLog): string {
    const value = weightUnit === "lbs" ? kgToLbs(log.weight) : log.weight;
    return `${value.toFixed(1)} ${weightUnit}`;
  }

  return (
    <Card className="p-0 overflow-hidden h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-[#9B9895]" />
          <h3 className="font-bold text-[#1A1916] dark:text-[#f7f6f3]">
            Weight History
          </h3>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B9895] hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-muted">
          <Plus size={12} />
          {adding ? "Cancel" : "Log weight"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            ref={formRef}
            key="add-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border ">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="wh-weight"
                    className="block text-[10px] font-bold tracking-wider uppercase text-[#9B9895] mb-1">
                    Weight
                  </label>
                  <div className="relative">
                    <input
                      id="wh-weight"
                      type="number"
                      step="0.1"
                      min={weightUnit === "lbs" ? 66 : 30}
                      max={weightUnit === "lbs" ? 500 : 230}
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      className="w-full px-3 py-2.5 pr-12 border border-border rounded-lg text-sm bg-card focus:bg-background outline-none transition-all font-mono"
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-[#9B9895]">
                      {weightUnit}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="wh-date"
                    className="block text-[10px] font-bold tracking-wider uppercase text-[#9B9895] mb-1">
                    Date
                  </label>
                  <input
                    id="wh-date"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card focus:bg-background outline-none transition-all font-mono"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="wh-note"
                  className="block text-[10px] font-bold tracking-wider uppercase text-[#9B9895] mb-1">
                  Note (optional)
                </label>
                <input
                  id="wh-note"
                  type="text"
                  maxLength={MAX_NOTE}
                  placeholder="e.g. morning, post-workout"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-card focus:bg-background outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm hover:opacity-85 transition-opacity disabled:opacity-50">
                  {saving ? "Saving…" : "Save weigh-in"}
                </button>
                <button
                  onClick={() => setAdding(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-60">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of past entries — newest first (the reducer already
          sorts by `loggedAt desc` when inserting). Cap the visible
          list at 10 rows but show a counter for the rest so the
          card stays compact even after years of use. */}
      {logs.length === 0 ? (
        <div className="p-6 text-sm text-[#9B9895] text-center">
          No weigh-ins yet. Tap &quot;Log weight&quot; to start tracking.
        </div>
      ) : (
        <div className="divide-y divide-[#E8E7E4] dark:divide-[#3a3a3a]">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1A1916] dark:text-[#f7f6f3] font-mono">
                  {displayWeight(log)}
                </div>
                <div className="text-[11px] text-[#9B9895] mt-0.5">
                  {formatDate(log.date)}
                  {log.note ? ` · ${log.note}` : ""}
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                aria-label="Delete weigh-in"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9B9895] hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {logs.length > 10 && (
            <div className="p-3 text-[11px] text-[#9B9895] text-center">
              +{logs.length - 10} more
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
