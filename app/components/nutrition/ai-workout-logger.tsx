"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  Sparkles,
  ArrowUp,
  Mic,
  Dumbbell,
  Flame,
  Bike,
  SquarePen,
  X,
} from "lucide-react";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import { useWorkoutChat } from "@/app/lib/use-workout-chat";
import { cn } from "@/app/lib/utils";
import type { WorkoutChatMessage, PendingWorkout } from "@/app/types";

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

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        "mb-8 flex flex-col",
        "rounded-3xl border border-border/50",
        "bg-card/60 backdrop-blur-xl",
        "shadow-[0_2px_8px_oklch(0_0_0/_0.05),0_12px_24px_oklch(0_0_0/_0.06)]",
        "overflow-hidden",
      )}
      style={{ color: "var(--color-ink)" }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-3 sm:px-4 py-3 border-b border-border/60">
        <button
          type="button"
          onClick={reset}
          aria-label="Start a new chat"
          className="touch-hitbox absolute left-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
          <SquarePen size={14} />
        </button>

        <div className="text-sm font-bold font-heading text-foreground">
          Log a workout
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="touch-hitbox absolute right-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* ── Body: empty-state greeting OR message thread ──────── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-5 px-5 sm:px-6 py-8 sm:py-9 text-center">
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
          className="h-[400px] overflow-y-auto px-3 sm:px-4 py-4 space-y-3"
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
        className="px-3 sm:px-4 pt-3 space-y-2"
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
