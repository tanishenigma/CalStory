"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Mic, X, ArrowUp } from "lucide-react";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import { useWorkoutChat } from "@/app/lib/use-workout-chat";
import { cn } from "@/app/lib/utils";
import type { WorkoutChatMessage, PendingWorkout } from "@/app/types";
import BorderGlow from "@/app/components/BorderGlow";

interface Props {
  onClose: () => void;
  date: string;
  userId: string;

  onEditWorkout?: (workout: PendingWorkout) => void;
}

/* ------------------------------------------------------------------
 * AIWorkoutLogger — inline chat panel for logging workouts via AI.
 * Expands on the page below the button row (no Sheet/drawer).
 * ------------------------------------------------------------------ */
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

  // Auto-scroll to the newest message whenever the thread changes.
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  function handleClose() {
    reset();
    onClose();
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

  return (
    <BorderGlow
      className="mb-8 animate-in slide-in-from-top-4 duration-300"
      borderRadius={16}
      glowColor="76 175 80"
      colors={[
        "var(--color-primary)",
        "oklch(0.7540 0.1770 145)",
        "oklch(0.8353 0.1870 145)",
      ]}
      glowRadius={35}
      glowIntensity={1.2}
      edgeSensitivity={25}
      animated>
      <div
        className={cn(
          "rounded-md border border-primary/20 dark:border-primary/30",
          " bg-transparent shadow-sm overflow-hidden",
        )}>
        {/* ── Message thread ──────────────────────────────────── */}
        <div
          ref={messagesScrollRef}
          className="h-[400px] overflow-y-auto px-4 py-4 space-y-3"
          data-lenis-prevent>
          {messages.map((msg) => (
            <WorkoutMessageBubble
              key={msg.id}
              message={msg}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              isLogging={isLogging}
              dirty={dirtyMessageIds.has(msg.id)}
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
              <div className="flex gap-1 px-4 py-3 bg-subtle border border-border rounded-2xl rounded-tl-sm">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* ── Suggestion chips ────────────────────────────────── */}
        {pendingSuggestions.length > 0 && !isLoading && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {pendingSuggestions.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-primary/10 bg-primary/5 text-foreground/70 hover:border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-foreground transition-all duration-200 whitespace-nowrap">
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ── Input row ───────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-border flex gap-2 items-center">
          <textarea
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
            rows={2}
            className={cn(
              "flex-1 bg-subtle border border-border rounded-xl",
              "pt-1.5 px-3 text-sm font-medium",
              "outline-none focus:border-primary/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors resize-none",
            )}
            aria-label="Describe your workout"
          />
          <div className="flex  gap-1.5">
            <button
              disabled
              aria-label="Voice input (coming soon)"
              className="p-2 rounded-xl border border-border text-muted-foreground opacity-40 cursor-not-allowed">
              <Mic size={15} />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className={cn(
                "p-2 rounded-xl font-bold transition-all",
                "bg-gradient-to-br from-primary to-primary/70 text-white",
                "hover:opacity-90 active:scale-95",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}>
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </BorderGlow>
  );
}

/* ------------------------------------------------------------------
 * WorkoutMessageBubble
 * ------------------------------------------------------------------ */
function WorkoutMessageBubble({
  message,
  onConfirm,
  onEdit,
  isLogging,
  dirty,
  onMarkDirty,
}: {
  message: WorkoutChatMessage;
  onConfirm: (saveAsTemplate: boolean) => void;
  onEdit: (workout: PendingWorkout) => void;
  isLogging: boolean;
  dirty: boolean;
  onMarkDirty: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const isFromRoutine = !!message.fromSavedRoutine;

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-2.5 rounded-md text-sm leading-relaxed",
          isUser
            ? " text-white bg-primary rounded-tr-sm"
            : "bg-subtle border border-border text-ink rounded-tl-sm",
        )}>
        <span
          dangerouslySetInnerHTML={{
            __html: message.content
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\n/g, "<br/>"),
          }}
        />
      </div>

      {!isUser && message.workout && (
        <div className="w-full max-w-[90%]">
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
        </div>
      )}
    </div>
  );
}
