"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  Sparkles,
  ArrowUp,
  Mic,
  Utensils,
  Dumbbell,
  Coffee,
  Flame,
  ChevronDown,
  SquarePen,
  X,
  FileText,
  History,
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
import { useAuthStore } from "@/app/store/authStore";

/* ------------------------------------------------------------------
 * AIFabChat — the panel that opens when the user taps the global FAB.
 *
 * One chat box to rule them all: each user turn is auto-routed to
 * either the food or workout pipeline by /api/ai-classify. Model
 * replies are tagged with a small "Food" or "Workout" pill so the
 * user can see which path interpreted which turn.
 *
 * Before the first message, the panel shows a quiet greeting plus a
 * grid of quick-action chips — a soft on-ramp for people who aren't
 * sure what to type. Picking one prefills + selects the input text
 * so a keystroke replaces it, rather than sending anything blind.
 * ------------------------------------------------------------------ */

// Textarea auto-grow bounds. One line to start (matches the old
// single-line input's feel), capped at ~4 lines before it scrolls
// internally instead of pushing the rest of the panel around.
const TEXTAREA_MIN_HEIGHT = 24;
const TEXTAREA_MAX_HEIGHT = 100;

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

const QUICK_ACTIONS: {
  label: string;
  icon: typeof Utensils;
  prefill: string;
}[] = [
  {
    label: "Log a meal",
    icon: Utensils,
    prefill: "Grilled chicken with rice and broccoli",
  },
  {
    label: "Log a workout",
    icon: Dumbbell,
    prefill: "30 minute upper body workout",
  },
  { label: "Log a snack", icon: Coffee, prefill: "Greek yogurt with berries" },
  { label: "Log cardio", icon: Flame, prefill: "5k run this morning" },
];

interface Props {
  onClose: () => void;
  /** Opens the saved-template picker. Optional — defaults to a no-op
   *  so the chip still renders even if the parent hasn't wired it up. */
  onUseTemplate?: () => void;
  /** Opens past logged entries. Optional — same default-no-op story. */
  onOpenHistory?: () => void;
  /** Opens the conversation switcher (past chat threads). Optional —
   *  the chevron still renders as a visual affordance if omitted. */
  onSwitchConversation?: () => void;
}

export default function AIFabChat({
  onClose,
  onUseTemplate = () => {},
  onOpenHistory = () => {},
  onSwitchConversation = () => {},
}: Props) {
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

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  /** Grows the textarea to fit its content, clamped to
   *  TEXTAREA_MAX_HEIGHT, beyond which it scrolls internally like
   *  any standard chat compose box (WhatsApp, Slack, etc). */
  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    el.style.height = `${next}px`;
    el.style.overflowY =
      el.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }

  // Re-measure whenever the value changes programmatically (quick
  // actions, edit-prefill) rather than only on keystrokes.
  useEffect(() => {
    autoResize(inputRef.current);
  }, [inputValue]);

  function handleEditIntent(intent: FabIntent) {
    editPending(intent, (prefill: string) => {
      setInputValue(prefill);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const len = prefill.length;
        el.setSelectionRange(len, len);
      });
    });
  }

  function handleQuickAction(prefill: string) {
    setInputValue(prefill);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(0, prefill.length);
    });
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

  async function handleSend(text?: string) {
    const msg = (text ?? inputValue).trim();
    if (!msg || isLoading) return;
    setInputValue("");
    // Collapse back to one line immediately rather than waiting on
    // the effect, so it doesn't visibly hang tall for a frame.
    requestAnimationFrame(() => autoResize(inputRef.current));
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

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        "w-[min(94vw,380px)] flex flex-col",
        "max-h-[76dvh]",
        "rounded-3xl border border-border",
        "bg-card",
        "shadow-[0_2px_8px_oklch(0_0_0/_0.05),0_12px_24px_oklch(0_0_0/_0.06)]",
        "hover:shadow-[0_4px_12px_oklch(0_0_0/_0.08),0_20px_40px_oklch(0_0_0/_0.10)]",
        "transition-shadow duration-200",
        "overflow-hidden",
      )}>
      {/* ── Header ───────────────────────────────────────────────
       * Three independent zones so the title can sit dead-center
       * regardless of how wide the left/right controls are:
       *   left   — conversation switcher (past chat threads)
       *   center — "Quick Log" title
       *   right  — new chat + close
       * ─────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-3 sm:px-4 py-3 border-b border-border/60">
        <button
          type="button"
          onClick={onSwitchConversation}
          aria-label="Switch conversation"
          className="touch-hitbox absolute left-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
          <ChevronDown size={14} />
        </button>

        <div className="text-sm font-bold font-heading text-foreground">
          Quick Log
        </div>

        <div className="absolute right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={reset}
            aria-label="Start a new chat"
            className="touch-hitbox w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
            <SquarePen size={14} />
          </button>
        </div>
      </div>

      {/* ── Body: empty-state greeting OR message thread ───────── */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-5 px-5 sm:px-6 py-8 sm:py-9 text-center overflow-y-auto">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-sm shrink-0">
            <Sparkles size={19} />
          </div>
          <div className="space-y-1">
            <div className="text-base font-bold font-heading leading-tight">
              Hey there!
            </div>
            <div className="text-sm text-muted-foreground leading-snug">
              Pick a quick action, or just tell me what you ate or trained.
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
          className="h-[min(340px,45dvh)] sm:h-[380px] overflow-y-auto px-3 sm:px-3.5 py-3 space-y-3"
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
      )}

      {/* ── Suggestion chips (mid-conversation follow-ups) ─────── */}
      {pendingSuggestions.length > 0 && !isLoading && !isEmpty && (
        <div className="px-3 sm:px-3.5 pb-2 flex flex-wrap justify-center gap-2">
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

      {/* Input row */}
      <div
        className="px-3 sm:px-3.5 pt-3 space-y-2 "
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex flex-col items-center  gap-2  rounded-[28px] border border-border bg-subtle pl-4 pr-2 py-2.5 min-h-[52px]">
          <div className="flex items-end gap-2 w-full ">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                autoResize(e.target);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                pendingWorkout
                  ? "Adjust the workout or log it →"
                  : pendingMeal
                    ? "Adjust the meal or log it →"
                    : "Type a message…"
              }
              disabled={isLoading}
              className={cn(
                "flex-1 bg-transparent text-base font-medium min-w-0",
                "outline-none placeholder:text-muted-foreground resize-none",
                "leading-6 py-0.5 my-5",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors overflow-y-auto scrollbar-hide",
              )}
              style={{ height: TEXTAREA_MIN_HEIGHT }}
              aria-label="Describe a meal or workout"
            />
            <button
              disabled
              aria-label="Voice input (coming soon)"
              className="touch-hitbox p-2.5 rounded-full text-muted-foreground opacity-40 cursor-not-allowed shrink-0 md:hidden ">
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
                "disabled:opacity-40 disabled:cursor-not-allowed  md:hidden",
              )}>
              <ArrowUp size={18} />
            </button>
          </div>

          {/* ── Use template / Log history row ───────────────────
           * Sits directly under the input pill, per the requested
           * layout — a second, lighter row of actions beneath the
           * compose box rather than above it. */}
          <div className="flex  items-center justify-start w-full ">
            <button
              type="button"
              onClick={onUseTemplate}
              className="touch-hitbox flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-full border border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-colors">
              <FileText size={13} />
              Use template
            </button>
            <button
              type="button"
              onClick={onOpenHistory}
              className="touch-hitbox flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-full border border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-colors">
              <History size={13} />
              Log history
            </button>

            <button
              disabled
              aria-label="Voice input (coming soon)"
              className="touch-hitbox p-2.5 rounded-full text-muted-foreground opacity-40 cursor-not-allowed shrink-0 hidden md:block">
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
                "disabled:opacity-40 disabled:cursor-not-allowed hidden md:block",
              )}>
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
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

  onEditFood: () => void;
  onEditWorkout: () => void;

  onDiscardFood: () => void;
  onDiscardWorkout: () => void;
  isLogging: boolean;

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
            "max-w-[85%] sm:max-w-[82%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed",
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
          "max-w-[90%] sm:max-w-[88%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed",
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

function SafeText({ text }: { text: string }) {
  const html = useMemo(() => {
    // Escape HTML entities first, then apply markdown-like formatting
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    // Sanitize with DOMPurify — allows only safe tags (strong, br, em)
    // ship-safe-ignore: XSS_DANGEROUS_HTML — content is DOMPurify-sanitized
    return DOMPurify.sanitize(escaped, {
      ALLOWED_TAGS: ["strong", "br", "em", "b", "i"],
      ALLOWED_ATTR: [],
    });
  }, [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
