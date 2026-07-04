"use client";

/**
 * FastingClient — full-page fasting tracker.
 *
 * State:
 *  - fastingSession from AppContext (persisted in Firestore → survives refresh)
 *  - All time math uses UTC milliseconds: elapsed = Date.now() - startUtcMs
 *  - DST / timezone shifts have no effect because we never do local-hour subtraction
 *
 * UI:
 *  - Circular progress ring (FastingRing component)
 *  - Draggable-equivalent start time picker (15-min snap) with native <input type="time">
 *  - Target duration selector (common presets + custom)
 *  - Start / Break / Complete buttons
 *  - History list of past completed sessions
 */

import { useState, useCallback } from "react";
import { Play, Square, CheckCircle, Clock, ChevronRight, TimerReset } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuthGuard, Spinner } from "@/app/hooks/useAuthGuard";
import { useFastingTimer } from "@/app/hooks/useFastingTimer";
import FastingRing from "@/app/components/FastingRing";
import BlurFade from "@/app/components/animations/BlurFade";
import { Card } from "@/app/components/ui/card";
import type { FastingSession } from "@/app/types";
import { todayLocalKey } from "@/app/context/AppContext";

// Common fasting presets (hours)
const PRESETS_H = [12, 14, 16, 18, 20, 24];
const MS_PER_H = 3_600_000;

/** Snap minutes to nearest 15 */
function snap15(date: Date): Date {
  const snapped = new Date(date);
  const m = snapped.getMinutes();
  snapped.setMinutes(Math.round(m / 15) * 15, 0, 0);
  return snapped;
}

/** Format a UTC-ms timestamp to a local time string HH:MM */
function toTimeInput(utcMs: number): string {
  const d = new Date(utcMs);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Parse a HH:MM local time string for today into a UTC-ms timestamp */
function fromTimeInput(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  return d.getTime();
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function FastingClient() {
  const { profile, isLoading } = useAuthGuard();
  const { state, setFastingSession, clearFastingSession } = useApp();
  const { fastingSession } = state;
  const timer = useFastingTimer(fastingSession);

  // Form state for starting a new fast
  const [targetHours, setTargetHours] = useState(16);
  const [startTimeInput, setStartTimeInput] = useState(
    toTimeInput(snap15(new Date()).getTime()),
  );
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(async () => {
    setSaving(true);
    // Parse start time (local) and snap to 15 min
    let startUtcMs = fromTimeInput(startTimeInput);
    startUtcMs = snap15(new Date(startUtcMs)).getTime();
    // Don't allow future start times beyond 2 minutes from now
    if (startUtcMs > Date.now() + 2 * 60_000) {
      startUtcMs = Date.now();
    }
    const session: FastingSession = {
      id: uid(),
      startUtcMs,
      targetDurationMs: targetHours * MS_PER_H,
      status: "active",
    };
    await setFastingSession(session);
    setSaving(false);
  }, [startTimeInput, targetHours, setFastingSession]);

  const handleComplete = useCallback(async () => {
    if (!fastingSession) return;
    setSaving(true);
    await setFastingSession({
      ...fastingSession,
      status: "completed",
      endUtcMs: Date.now(),
    });
    setSaving(false);
  }, [fastingSession, setFastingSession]);

  const handleBreak = useCallback(async () => {
    if (!fastingSession) return;
    setSaving(true);
    await setFastingSession({
      ...fastingSession,
      status: "broken",
      endUtcMs: Date.now(),
    });
    setSaving(false);
  }, [fastingSession, setFastingSession]);

  const handleReset = useCallback(async () => {
    setSaving(true);
    await clearFastingSession();
    setSaving(false);
  }, [clearFastingSession]);

  if (isLoading || !profile) return <Spinner variant="dashboard" />;

  const isActive = fastingSession?.status === "active";
  const isEnded =
    fastingSession?.status === "completed" || fastingSession?.status === "broken";

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BlurFade>
        <div className="pt-2">
          <h1 className="text-3xl font-bold mb-2">Fasting Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Track your intermittent fasting window
          </p>
        </div>
      </BlurFade>

      {/* ── Active fast ring ── */}
      {(isActive || isEnded) && fastingSession && (
        <BlurFade delay={0.05}>
          <Card className="p-8 flex flex-col items-center gap-6">
            <FastingRing
              progress={timer.progress}
              elapsedLabel={timer.elapsedLabel}
              remainingLabel={timer.remainingLabel}
              targetLabel={timer.targetLabel}
              isComplete={timer.isComplete || isEnded}
              size={260}
            />

            {/* Start time info */}
            <p className="text-sm text-muted-foreground">
              Started at{" "}
              <span className="font-semibold text-foreground">
                {new Date(fastingSession.startUtcMs).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {" · "}
              Target:{" "}
              <span className="font-semibold text-foreground">
                {fastingSession.targetDurationMs / MS_PER_H}h fast
              </span>
            </p>

            {/* Action buttons */}
            {isActive && (
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  id="fasting-complete"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity disabled:opacity-50"
                >
                  <CheckCircle size={15} />
                  Complete
                </button>
                <button
                  onClick={handleBreak}
                  disabled={saving}
                  id="fasting-break"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                >
                  <Square size={13} />
                  Break fast
                </button>
              </div>
            )}

            {isEnded && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Fast {fastingSession.status === "completed" ? "completed 🎉" : "broken"}
                </p>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  id="fasting-reset"
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <TimerReset size={14} />
                  Start new fast
                </button>
              </div>
            )}
          </Card>
        </BlurFade>
      )}

      {/* ── Start a new fast form ── */}
      {!isActive && !isEnded && (
        <BlurFade delay={0.05}>
          <Card className="p-6 flex flex-col gap-5">
            <h2 className="text-base font-bold">Start a fast</h2>

            {/* Target duration presets */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                Duration
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESETS_H.map((h) => (
                  <button
                    key={h}
                    onClick={() => setTargetHours(h)}
                    id={`fasting-preset-${h}h`}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      targetHours === h
                        ? "bg-foreground text-background"
                        : "border border-border hover:border-foreground/30"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Start time — 15-min snap via native time input */}
            <div>
              <label
                htmlFor="fasting-start-time"
                className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-2"
              >
                Start time (snaps to 15 min)
              </label>
              <input
                id="fasting-start-time"
                type="time"
                step={900} // 15 minutes in seconds
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Future start times will be corrected to now
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={saving}
              id="fasting-start"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              <Play size={15} />
              {saving ? "Starting…" : `Start ${targetHours}h fast`}
            </button>
          </Card>
        </BlurFade>
      )}

      {/* ── How it works ── */}
      <BlurFade delay={0.15}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              How it works
            </span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-primary" />
              Your fasting session is saved to the cloud — it survives page refresh and device switches.
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-primary" />
              Time is tracked in UTC so daylight saving time changes never affect your elapsed time.
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="flex-shrink-0 mt-0.5 text-primary" />
              Start time snaps to 15-minute intervals for cleaner tracking.
            </li>
          </ul>
        </Card>
      </BlurFade>
    </div>
  );
}
