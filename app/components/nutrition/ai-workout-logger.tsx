"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUp,
  Mic,
  Dumbbell,
  Flame,
  Bike,
  SquarePen,
  X,
  FileText,
  History,
  Calendar,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import { UpgradePrompt } from "@/app/components/UpgradePrompt";
import { useWorkoutChat } from "@/app/lib/use-workout-chat";
import { cn } from "@/app/lib/utils";
import { useApp, todayLocalKey, uid } from "@/app/context/AppContext";
import { toast } from "sonner";
import type {
  WorkoutChatMessage,
  WorkoutChatSession,
  PendingWorkout,
  Workout,
  SavedWorkout,
} from "@/app/types";

/* ------------------------------------------------------------------
 * AIWorkoutLogger — inline "log a workout" panel embedded on the
 * page.
 *
 * Restyled to match AIFabChat: a quiet empty-state greeting with
 * quick-action chips before the first message, the same pill-shaped
 * input row with a disabled mic and gradient send button, and cards
 * that can be discarded inline via a hover-revealed button (visual
 * dismissal only — useWorkoutChat has no discard call). The dirty-
 * routine tracking from the original is preserved as-is.
 * ------------------------------------------------------------------ */

/** Quick-start chips shown in the empty state. Each prefills the
 *  input with an editable example rather than sending immediately. */
const QUICK_ACTIONS: {
  label: string;
  icon: typeof Dumbbell;
  prefill: string;
}[] = [
  {
    label: "Upper body",
    icon: Dumbbell,
    prefill: "30 minute upper body workout",
  },
  {
    label: "Leg day",
    icon: Flame,
    prefill: "Squats, lunges, and leg press — 45 min",
  },
  {
    label: "Cardio",
    icon: Bike,
    prefill: "5k run this morning",
  },
  {
    label: "Quick set",
    icon: Dumbbell,
    prefill: "Cable rows 60kg 3×12",
  },
];

interface Props {
  onClose: () => void;
  date: string;
  userId: string;
  onEditWorkout?: (workout: PendingWorkout) => void;
}

export default function AIWorkoutLogger({
  onClose,
  date,
  userId,
  onEditWorkout,
}: Props) {
  const {
    messages,
    isLoading,
    pendingSuggestions,
    chatHistory,
    loadChat,
    sendMessage,
    confirmLog,
    reset,
  } = useWorkoutChat({ date, userId });

  const [inputValue, setInputValue] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  // Track which routine-derived message ids the user has edited, so
  // the confirmation card can re-show the toggle as "Save changes".
  const [dirtyMessageIds, setDirtyMessageIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Visual-only dismissal — useWorkoutChat has no discard call, so
  // we just hide the card locally and let the message text stand.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeDrawer, setActiveDrawer] = useState<
    "template" | "history" | "chat" | null
  >(null);

  const { state, addWorkout } = useApp();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Past workouts across days, newest first, for the history drawer.
  const historyWorkouts = useMemo(() => {
    const all: (Workout & { day: string })[] = [];
    const sortedDays = Object.keys(state.workouts).sort().reverse();
    for (const day of sortedDays) {
      const dayWorkouts = state.workouts[day] ?? [];
      for (const w of [...dayWorkouts].reverse()) {
        all.push({ ...w, day });
      }
    }
    return all;
  }, [state.workouts]);

  // Saved workout templates, for the template drawer.
  const templates = state.savedWorkouts ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  function handleClose() {
    reset();
    onClose();
  }

  function handleQuickAction(prefill: string) {
    setInputValue(prefill);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, prefill.length);
    });
  }

  async function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;
    setInputValue("");
    await sendMessage(msg);
  }

  async function handleConfirm(saveAsTemplate: boolean) {
    setIsLogging(true);
    try {
      await confirmLog(saveAsTemplate);
    } finally {
      setIsLogging(false);
    }
  }

  function handleEdit(workout: PendingWorkout) {
    onEditWorkout?.(workout);
    handleClose();
  }

  function handleDismiss(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  /** Prefill the input from a saved workout template and send it. */
  function handleUseTemplate(template: SavedWorkout) {
    setActiveDrawer(null);
    const msg = `Log workout: ${template.name} — ${template.exercises.map((e) => e.name).join(", ")}`;
    handleSend(msg);
  }

  /** Repeat a past workout — log it again for today with a fresh ID. */
  async function handleRepeatWorkout(workout: Workout) {
    const fresh: Workout = {
      ...workout,
      id: uid(),
    };
    await addWorkout(fresh);
    toast.success(`"${workout.name}" logged for today! 🎉`);
    setActiveDrawer(null);
  }

  const isEmpty = messages.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.165, 0.84, 0.44, 1] }}
      className="w-full">
      <div
      className={cn(
        "relative mb-8 flex min-h-[28rem] w-full flex-col sm:min-h-[32rem]",
        "rounded-3xl border border-border/60 bg-card shadow-[0_12px_30px_oklch(0_0_0/_0.08)]",
        "overflow-hidden",
      )}
      style={{ color: "var(--color-ink)" }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              AI workout logger
            </p>
            <h2 id="ai-workout-logger-title" className="truncate text-base font-bold font-heading text-foreground">
              Log a workout
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={reset}
          aria-label="Start a new chat"
          className="touch-hitbox flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
          title="Start a new chat">
          <SquarePen size={14} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="touch-hitbox flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
          <X size={14} />
        </button>
        </div>
      </div>

      {/* ── Body: empty-state greeting OR message thread ──────── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-5 px-5 py-8 text-center sm:px-6 sm:py-9">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-sm shrink-0">
            <Sparkles size={19} />
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold font-heading leading-tight">
              What did you train?
            </div>
            <div className="text-sm text-muted-foreground leading-snug">
              Pick a quick action, or just describe the session.
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 w-full">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action.prefill)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-2xl min-h-[44px]",
                    "border border-border bg-subtle",
                    "text-xs font-semibold text-foreground/80",
                    "hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
                    "transition-colors duration-150",
                  )}>
                  <Icon size={14} className="text-primary shrink-0" />
                  <span className="whitespace-nowrap">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="h-[min(24rem,50vh)] min-h-[15rem] overflow-y-auto px-3 py-4 space-y-3 sm:px-4"
          data-lenis-prevent>
          {messages.map((msg) => (
            <WorkoutMessageBubble
              key={msg.id}
              message={msg}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              onDismiss={() => handleDismiss(msg.id)}
              isLogging={isLogging}
              dirty={dirtyMessageIds.has(msg.id)}
              dismissed={dismissedIds.has(msg.id)}
              onMarkDirty={(id) =>
                setDirtyMessageIds((prev) => {
                  if (prev.has(id)) return prev;
                  const next = new Set(prev);
                  next.add(id);
                  return next;
                })
              }
            />
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="flex gap-1 px-4 py-3 bg-subtle border border-border rounded-xl rounded-tl-sm">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Suggestion chips ─────────────────────────────────── */}
      {pendingSuggestions.length > 0 && !isLoading && !isEmpty && (
        <div className="px-3 sm:px-4 pb-2 flex flex-wrap justify-center gap-2">
          {pendingSuggestions.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="px-3 py-2 min-h-[36px] text-xs font-medium rounded-full border border-primary/10 bg-primary/5 text-foreground/70 hover:border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-foreground transition-all duration-200 whitespace-nowrap">
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ── Input row ──────────────────────────────────────────
       * Textarea instead of a single-line input (workouts run
       * longer — sets, reps, weights), but kept inside the same
       * pill-shaped shell as the food logger and the FAB chat. */}
      <div
        className="shrink-0 px-3 pt-3 space-y-2 sm:px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-end gap-2 rounded-[28px] border border-border bg-subtle pl-4 pr-2 py-3 min-h-[60px]">
          <textarea
            ref={inputRef}
            id="ai-workout-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="e.g. Cable rows 60kg 3×12"
            disabled={isLoading}
            rows={1}
            className={cn(
              // 16px floor prevents iOS Safari auto-zoom on focus.
              "flex-1 bg-transparent text-base font-medium min-w-0 resize-none",
              "outline-none placeholder:text-muted-foreground py-1.5",
              "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            )}
            aria-label="Describe your workout"
          />
          <button
            disabled
            aria-label="Voice input (coming soon)"
            className="touch-hitbox p-2.5 rounded-full text-muted-foreground opacity-40 cursor-not-allowed shrink-0">
            <Mic size={18} />
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              "touch-hitbox p-3 rounded-full font-bold transition-all shrink-0",
              "bg-gradient-to-br from-primary to-primary/70 text-white",
              "hover:opacity-90 active:scale-95",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}>
            <ArrowUp size={18} />
          </button>
        </div>

        {/* ── Use template / Log history buttons ─────────────── */}
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveDrawer(activeDrawer === "template" ? null : "template")
            }
            className={cn(
              "touch-hitbox flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-full border transition-colors",
              activeDrawer === "template"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
            )}>
            <FileText size={13} />
            Use template
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveDrawer(activeDrawer === "history" ? null : "history")
            }
            className={cn(
              "touch-hitbox flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-full border transition-colors",
              activeDrawer === "history"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
            )}>
            <History size={13} />
            Log history
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveDrawer(activeDrawer === "chat" ? null : "chat")
            }
            className={cn(
              "touch-hitbox flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
              activeDrawer === "chat"
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
            )}>
            <MessageSquare size={13} />
            Past chats
          </button>
        </div>
      </div>

      {/* ── Drawer overlays ───────────────────────────────────── */}
      {activeDrawer === "template" && (
        <div className="absolute inset-0 z-20 flex flex-col bg-card">
          <WorkoutTemplateDrawer
            templates={templates}
            onUse={handleUseTemplate}
            onClose={() => setActiveDrawer(null)}
          />
        </div>
      )}
      {activeDrawer === "history" && (
        <div className="absolute inset-0 z-20 flex flex-col bg-card">
          <WorkoutHistoryDrawer
            workouts={historyWorkouts}
            onRepeat={handleRepeatWorkout}
            onClose={() => setActiveDrawer(null)}
          />
        </div>
      )}
      {activeDrawer === "chat" && (
        <div className="absolute inset-0 z-20 flex min-h-0 flex-col bg-card">
          <WorkoutChatHistoryDrawer
            sessions={chatHistory}
            onSelect={(session) => {
              loadChat(session);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        </div>
      )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------
 * WorkoutTemplateDrawer — saved workout templates
 * ------------------------------------------------------------------ */
function WorkoutTemplateDrawer({
  templates,
  onUse,
  onClose,
}: {
  templates: SavedWorkout[];
  onUse: (t: SavedWorkout) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to AI workout logger"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
            <ArrowLeft size={14} />
          </button>
          <FileText size={14} className="text-primary" />
          <span className="truncate">Templates</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2" data-lenis-prevent>
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <Dumbbell size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No templates yet. Save a workout as a template to find it here!
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="px-3 py-1">
              <button
                type="button"
                onClick={() => onUse(template)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-subtle border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left">
                <Dumbbell size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {template.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {template.type} · {template.exercises.length} exercise
                    {template.exercises.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * WorkoutHistoryDrawer — past workouts with "Repeat" action
 * ------------------------------------------------------------------ */
function WorkoutHistoryDrawer({
  workouts,
  onRepeat,
  onClose,
}: {
  workouts: (Workout & { day: string })[];
  onRepeat: (workout: Workout) => Promise<void>;
  onClose: () => void;
}) {
  const [repeatedIds, setRepeatedIds] = useState<Set<string>>(new Set());
  const [repeatLoading, setRepeatLoading] = useState<string | null>(null);

  const today = todayLocalKey();

  const grouped = useMemo(() => {
    const map = new Map<string, (Workout & { day: string })[]>();
    for (const w of workouts) {
      if (!map.has(w.day)) map.set(w.day, []);
      map.get(w.day)!.push(w);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [workouts]);

  function formatDay(day: string): string {
    if (day === today) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (day === yKey) return "Yesterday";
    const d = new Date(day + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  async function handleRepeat(workout: Workout) {
    if (repeatLoading) return;
    setRepeatLoading(workout.id);
    try {
      await onRepeat(workout);
      setRepeatedIds((prev) => new Set(prev).add(workout.id));
    } finally {
      setRepeatLoading(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to AI workout logger"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
            <ArrowLeft size={14} />
          </button>
          <History size={14} className="text-primary" />
          <span className="truncate">Log history</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2" data-lenis-prevent>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <Dumbbell size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No workouts logged yet. Start training!
            </p>
          </div>
        ) : (
          grouped.map(([day, dayWorkouts]) => (
            <div key={day} className="px-3 py-1">
              <div className="flex items-center gap-2 py-1.5">
                <Calendar size={11} className="text-muted-foreground/60" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {formatDay(day)}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayWorkouts.map((workout) => {
                  const isRepeated = repeatedIds.has(workout.id);
                  return (
                    <div
                      key={workout.id}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-subtle px-2.5 py-2 transition-colors hover:border-border/80 sm:px-3">
                      <Dumbbell
                        size={12}
                        className="text-primary shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {workout.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {workout.type} · {workout.duration} min
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={repeatLoading === workout.id}
                        onClick={() => handleRepeat(workout)}
                        aria-label={
                          isRepeated
                            ? `${workout.name} repeated`
                            : `Repeat ${workout.name} for today`
                        }
                        className={cn(
                          "shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95",
                          isRepeated
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            : "bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15",
                          repeatLoading === workout.id &&
                            "opacity-60 cursor-not-allowed",
                        )}>
                        {isRepeated ? (
                          <>
                            <CheckCircle2 size={10} />
                            <span className="hidden xs:inline">Done</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw
                              size={10}
                              className={cn(
                                repeatLoading === workout.id && "animate-spin",
                              )}
                            />
                            <span className="hidden xs:inline">Repeat</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WorkoutChatHistoryDrawer({
  sessions,
  onSelect,
  onClose,
}: {
  sessions: WorkoutChatSession[];
  onSelect: (session: WorkoutChatSession) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to AI workout logger"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
            <ArrowLeft size={14} />
          </button>
          <MessageSquare size={14} className="shrink-0 text-primary" />
          <span className="truncate">Past chats</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close past chats"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4" data-lenis-prevent>
        {sessions.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquare size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Your previous workout chats will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const lastModelMessage = [...session.messages]
                .reverse()
                .find((message) => message.role === "model");
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session)}
                  className="flex w-full min-w-0 items-start gap-3 rounded-2xl border border-border/60 bg-subtle p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5">
                  <MessageSquare size={15} className="mt-0.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {session.label}
                    </span>
                    <span className="mt-1 block line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                      {lastModelMessage?.content ?? "Workout conversation"}
                    </span>
                    <time className="mt-2 block text-[10px] font-medium text-muted-foreground/70">
                      {new Date(session.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * WorkoutMessageBubble
 * ------------------------------------------------------------------ */
function WorkoutMessageBubble({
  message,
  onConfirm,
  onEdit,
  onDismiss,
  isLogging,
  dirty,
  dismissed,
  onMarkDirty,
}: {
  message: WorkoutChatMessage;
  onConfirm: (saveAsTemplate: boolean) => void;
  onEdit: (workout: PendingWorkout) => void;
  onDismiss: () => void;
  isLogging: boolean;
  dirty: boolean;
  dismissed: boolean;
  onMarkDirty: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const isFromRoutine = !!message.fromSavedRoutine;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed",
          isUser
            ? "text-white bg-primary rounded-tr-sm"
            : "bg-subtle border border-border text-ink rounded-tl-sm",
        )}>
        <SafeText text={message.content} />
        {!isUser && message.upgradeRequired && <UpgradePrompt />}
      </div>

      {!isUser && message.workout && !dismissed && (
        <div className="w-full max-w-[92%] relative group">
          <WorkoutConfirmationCard
            workout={message.workout}
            askSaveTemplate={message.askSaveTemplate ?? false}
            onConfirm={onConfirm}
            onEdit={() => {
              // The user is taking this workout into the form for
              // edits. Flag it dirty so the card re-shows the
              // "Save changes" toggle when/if it comes back.
              onMarkDirty(message.id);
              const w = message.workout;
              if (w) onEdit(w);
            }}
            isLogging={isLogging}
            fromSavedRoutine={isFromRoutine}
            dirty={dirty}
          />
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLogging}
            aria-label="Discard this workout estimate"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function SafeText({ text }: { text: string }) {
  const html = useMemo(() => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    // ship-safe-ignore: XSS_DANGEROUS_HTML — content is DOMPurify-sanitized
    return DOMPurify.sanitize(escaped, {
      ALLOWED_TAGS: ["strong", "br", "em", "b", "i"],
      ALLOWED_ATTR: [],
    });
  }, [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
