"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ArrowUp,
  Mic,
  Utensils,
  Dumbbell,
  X,
  ForkKnife,
} from "lucide-react";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import {
  useAIFabChat,
  type FabIntent,
  type FabMessage,
} from "@/app/lib/use-ai-fab-chat";
import { cn } from "@/app/lib/utils";
import { todayLocalKey } from "@/app/context/AppContext";
import { usePrefsStore } from "@/app/store/prefsStore";
import { useAuthStore } from "@/app/store/authStore";

/* ------------------------------------------------------------------
 * AIFabChat — the panel that opens when the user taps the global FAB.
 *
 * One chat box to rule them all: each user turn is auto-routed to
 * either the food or workout pipeline by /api/ai-classify. Model
 * replies are tagged with a small "Food" or "Workout" pill so the
 * user can see which path interpreted which turn.
 *
 * The panel is positioned above the FAB (bottom-anchored) and sizes
 * itself so it never exceeds the viewport. The auto-scroll effect
 * only fires on new user/model turns (and while loading), not on
 * every keystroke.
 * ------------------------------------------------------------------ */
const INTENT_META: Record<
  FabIntent,
  { label: string; tone: string; icon: typeof Utensils }
> = {
  food: {
    label: "Food",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: Utensils,
  },
  workout: {
    label: "Workout",
    tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: Dumbbell,
  },
};

interface Props {
  onClose: () => void;
}

export default function AIFabChat({ onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid ?? "anonymous";
  const date = todayLocalKey();

  const {
    messages,
    isLoading,
    pendingMeal,
    pendingWorkout,
    pendingSuggestions,
    confirmedIntents,
    sendMessage,
    confirmLog,
    editPending,
    discardPending,
    reset,
  } = useAIFabChat({ date, userId });

  const [inputValue, setInputValue] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // Ref for the chat input — used by Edit to focus + prefill.
  const inputRef = useRef<HTMLInputElement | null>(null);

  /** Wire up by Edit: focuses the input and prefills with a
   *  refinement phrase so the user can type their correction. */
  function handleEditIntent(intent: FabIntent) {
    editPending(intent, (prefill: string) => {
      setInputValue(prefill);
      // Focus + place caret at the end so the user can keep typing.
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const len = prefill.length;
        inputRef.current?.setSelectionRange(len, len);
      });
    });
  }

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

  async function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;
    setInputValue("");
    await sendMessage(msg);
  }

  async function handleConfirm(intent: FabIntent, saveAsTemplate = false) {
    setIsLogging(true);
    try {
      await confirmLog(intent, saveAsTemplate);
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <div
      className={cn(
        "w-[min(92vw,350px)]",
        "rounded-md border border-border",
        "bg-card",
        "shadow-[0_2px_8px_oklch(0_0_0/_0.05),0_12px_24px_oklch(0_0_0/_0.06)]",
        "hover:shadow-[0_4px_12px_oklch(0_0_0/_0.08),0_20px_40px_oklch(0_0_0/_0.10)]",
        "transition-shadow duration-200",
        "overflow-hidden",
      )}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shrink-0">
            <ForkKnife size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold font-heading leading-tight">
              Quick Log
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              AI detects food &amp; workouts
            </div>
          </div>
        </div>
      </div>

      {/* ── Message thread ──────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="h-[340px] overflow-y-auto px-3.5 py-3 space-y-3"
        data-lenis-prevent>
        {messages.map((m) => (
          <FabMessageBubble
            key={m.id}
            message={m}
            onConfirmFood={() => handleConfirm("food")}
            onConfirmWorkout={(saveAsTemplate) =>
              handleConfirm("workout", saveAsTemplate)
            }
            onEditFood={() => handleEditIntent("food")}
            onEditWorkout={() => handleEditIntent("workout")}
            onDiscardFood={() => discardPending("food")}
            onDiscardWorkout={() => discardPending("workout")}
            isLogging={isLogging}
            alreadySaved={
              m.role === "model" && m.intent
                ? confirmedIntents.has(m.intent)
                : false
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

      {/* ── Suggestion chips ────────────────────────────────── */}
      {pendingSuggestions.length > 0 && !isLoading && (
        <div className="px-3.5 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
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
      <div className="px-3.5 py-3 border-t border-border flex gap-2 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            pendingWorkout
              ? "Adjust the workout or log it →"
              : pendingMeal
                ? "Adjust the meal or log it →"
                : "What did you eat or train?"
          }
          disabled={isLoading}
          className={cn(
            "flex-1 bg-subtle border border-border rounded-xl",
            "py-2.5 px-3 text-sm font-medium",
            "outline-none focus:border-primary/40",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          )}
          aria-label="Describe a meal or workout"
        />
        <button
          disabled
          aria-label="Voice input (coming soon)"
          className="p-2.5 rounded-xl border border-border text-muted-foreground opacity-40 cursor-not-allowed">
          <Mic size={16} />
        </button>
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
          className={cn(
            "p-2.5 rounded-xl font-bold transition-all",
            "bg-gradient-to-br from-primary to-primary/70 text-white",
            "hover:opacity-90 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}>
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * FabMessageBubble
 *
 * Renders one message in the timeline. User bubbles get the intent
 * pill once classification completes; model bubbles get the same
 * pill next to the assistant's reply so it's obvious which pipeline
 * produced the structured card below.
 * ------------------------------------------------------------------ */
function FabMessageBubble({
  message,
  onConfirmFood,
  onConfirmWorkout,
  onEditFood,
  onEditWorkout,
  onDiscardFood,
  onDiscardWorkout,
  isLogging,
  alreadySaved,
}: {
  message: FabMessage;
  onConfirmFood: () => void;
  onConfirmWorkout: (saveAsTemplate: boolean) => void;
  /** Wire the in-card Edit button back to the chat input: focuses
   *  the box and prefills with a refinement phrase so the user can
   *  type their correction (e.g. "Adjust the meal 'X' — use 200g"). */
  onEditFood: () => void;
  onEditWorkout: () => void;
  /** Discard the pending payload without saving. Removes the card
   *  from the timeline and marks the intent as confirmed so the
   *  state machine stays consistent. */
  onDiscardFood: () => void;
  onDiscardWorkout: () => void;
  isLogging: boolean;
  /** True when this model message's payload (meal or workout) has
   *  already been confirmed and saved. The matching card shows a
   *  "Saved ✓" label so a stale tap can't double-save. */
  alreadySaved?: boolean;
}) {
  if (message.role === "user") {
    // Mixed messages (food + workout) get both pills side-by-side
    // so the user can see at a glance which agents are running.
    const intents = message.intents ?? [];
    return (
      <div className="flex flex-col items-end gap-1">
        {intents.length > 0 && (
          <div className="flex items-center gap-1">
            {intents.map((it) => {
              const m = INTENT_META[it];
              const Icon = m.icon;
              return (
                <div
                  key={it}
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    m.tone,
                  )}>
                  <Icon size={10} />
                  {m.label}
                </div>
              );
            })}
          </div>
        )}
        <div
          className={cn(
            // Tighter `rounded-xl` keeps short bubbles from looking
            // like fat pills; the `rounded-tr-sm` corner is the
            // classic chat-bubble "tail" toward the speaker.
            "max-w-[82%] px-3.5 py-2 rounded-xl text-sm leading-relaxed",
            "text-white bg-primary rounded-tr-sm",
          )}>
          <SafeText text={message.text} />
        </div>
      </div>
    );
  }

  // Model bubble.
  const meta = INTENT_META[message.intent];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className={cn(
          "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
          meta.tone,
        )}>
        <Icon size={10} />
        {meta.label}
      </div>
      <div
        className={cn(
          // Model bubble — same `rounded-xl` as the user bubble for
          // visual consistency. The `rounded-tl-sm` corner points
          // away from the assistant, like a tail in the right place.
          "max-w-[88%] px-3.5 py-2 rounded-xl text-sm leading-relaxed",
          "bg-subtle border border-border text-ink rounded-tl-sm",
          message.transient && "opacity-70 italic",
        )}>
        <SafeText text={message.text} />
      </div>

      {message.meal && (
        <div className="w-full max-w-[95%] relative group">
          <MealConfirmationCard
            meal={message.meal}
            onConfirm={onConfirmFood}
            onEdit={onEditFood}
            isLogging={isLogging}
            alreadySaved={alreadySaved}
          />
          {!alreadySaved && (
            <button
              type="button"
              onClick={onDiscardFood}
              disabled={isLogging}
              aria-label="Discard this meal estimate"
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed">
              ×
            </button>
          )}
        </div>
      )}

      {message.workout && (
        <div className="w-full max-w-[95%] relative group">
          <WorkoutConfirmationCard
            workout={message.workout}
            askSaveTemplate={message.askSaveTemplate ?? false}
            onConfirm={onConfirmWorkout}
            onEdit={onEditWorkout}
            isLogging={isLogging}
            alreadySaved={alreadySaved}
          />
          {!alreadySaved && (
            <button
              type="button"
              onClick={onDiscardWorkout}
              disabled={isLogging}
              aria-label="Discard this workout estimate"
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed">
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * SafeText — render message text with **bold** → <strong> and
 * newlines → <br/>. We intentionally reuse the same minimal
 * markdown subset the inline loggers use; we don't want a full MD
 * renderer in a 360px-wide popover.
 * ------------------------------------------------------------------ */
function SafeText({ text }: { text: string }) {
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
