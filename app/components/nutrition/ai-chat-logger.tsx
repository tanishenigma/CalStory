"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUp,
  Mic,
  Utensils,
  Coffee,
  Salad,
  Soup,
  SquarePen,
  X,
  History,
  Calendar,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import { useFoodChat } from "@/app/lib/use-food-chat";
import { cn } from "@/app/lib/utils";
import { useApp, todayLocalKey, uid } from "@/app/context/AppContext";
import type { ChatMessage, PendingMeal, Meal } from "@/app/types";
import { toast } from "sonner";

/* ------------------------------------------------------------------
 * AIChatLogger — inline "log a meal" panel embedded on the page.
 *
 * Restyled to match AIFabChat: a quiet empty-state greeting with
 * quick-action chips before the first message, an intent-free
 * message thread (this panel only ever talks food, so no pill is
 * needed), and the same pill-shaped input row with a disabled mic
 * and a gradient send button. Cards can be dismissed inline via a
 * hover-revealed discard button, mirroring the FAB chat pattern —
 * dismissal is local/visual only, since useFoodChat doesn't expose
 * a backing discard call.
 * ------------------------------------------------------------------ */

/** Quick-start chips shown in the empty state. Each prefills the
 *  input with an editable example rather than sending immediately. */
const QUICK_ACTIONS: {
  label: string;
  icon: typeof Utensils;
  prefill: string;
}[] = [
  {
    label: "Breakfast",
    icon: Coffee,
    prefill: "2 eggs, toast, and a banana",
  },
  {
    label: "Lunch",
    icon: Salad,
    prefill: "Paneer bowl with rice and salad",
  },
  {
    label: "Dinner",
    icon: Soup,
    prefill: "Dal, roti, and sabzi",
  },
  {
    label: "Snack",
    icon: Utensils,
    prefill: "Greek yogurt with berries",
  },
];

interface Props {
  onClose: () => void;
  date: string;
  userId: string;
  onEditMeal?: (meal: PendingMeal) => void;
}

export default function AIChatLogger({
  onClose,
  date,
  userId,
  onEditMeal,
}: Props) {
  const {
    messages,
    isLoading,
    pendingSuggestions,
    sendMessage,
    confirmLog,
    reset,
  } = useFoodChat({ date, userId });

  const [inputValue, setInputValue] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  // Visual-only dismissal — useFoodChat has no discard call, so we
  // just hide the card locally and let the message text stand.
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [showHistory, setShowHistory] = useState(false);

  const { state, addMeal } = useApp();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // All meals across days, newest first, for the history drawer.
  const historyMeals = useMemo(() => {
    const all: (Meal & { day: string })[] = [];
    const sortedDays = Object.keys(state.meals).sort().reverse();
    for (const day of sortedDays) {
      const dayMeals = state.meals[day] ?? [];
      for (const meal of [...dayMeals].reverse()) {
        all.push({ ...meal, day });
      }
    }
    return all;
  }, [state.meals]);

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

  async function handleConfirm() {
    setIsLogging(true);
    try {
      await confirmLog();
    } finally {
      setIsLogging(false);
    }
  }

  function handleEdit(meal: PendingMeal) {
    onEditMeal?.(meal);
    handleClose();
  }

  function handleDismiss(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  /** Repeat a past meal — log it again for today with a fresh ID. */
  async function handleRepeatMeal(meal: Meal) {
    const today = todayLocalKey();
    const fresh: Meal = {
      ...meal,
      id: uid(),
      savedDate: today,
    };
    await addMeal(fresh);
    toast.success(`"${meal.name}" logged for today! 🎉`);
    setShowHistory(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.165, 0.84, 0.44, 1] }}>
      <div
        className={cn(
          "mb-8 flex flex-col",
          "rounded-3xl border border-border/50",
          "bg-card/60 backdrop-blur-xl",
          "shadow-[0_2px_8px_oklch(0_0_0/_0.05),0_12px_24px_oklch(0_0_0/_0.06)]",
          "overflow-hidden",
        )}
        style={{ color: "var(--color-ink)" }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center px-3 sm:px-4 py-3 border-b border-border/60">
          <button
            type="button"
            onClick={reset}
            aria-label="Start a new chat"
            className="touch-hitbox absolute left-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
            <SquarePen size={14} />
          </button>

          <div className="text-sm font-bold font-heading text-foreground">
            Log a meal
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="touch-hitbox absolute right-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* ── Body: empty-state greeting OR message thread ────── */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-5 px-5 sm:px-6 py-8 sm:py-9 text-center">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-sm shrink-0">
              <Sparkles size={19} />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold font-heading leading-tight">
                What did you eat?
              </div>
              <div className="text-sm text-muted-foreground leading-snug">
                Pick a quick action, or just describe the meal.
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
            className="h-[340px] overflow-y-auto px-3 sm:px-4 py-4 space-y-3"
            data-lenis-prevent>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
                onDismiss={() => handleDismiss(msg.id)}
                isLogging={isLogging}
                dismissed={dismissedIds.has(msg.id)}
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

        {/* ── Input row ────────────────────────────────────────── */}
        <div
          className="px-3 sm:px-4 pt-3 space-y-2"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}>
          <div className="flex items-center gap-2 rounded-[28px] border border-border bg-subtle pl-4 pr-2 py-3.5 min-h-[60px]">
            <input
              ref={inputRef}
              id="ai-food-chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g. 8oz milk & avocado toast…"
              disabled={isLoading}
              className={cn(
                // 16px floor prevents iOS Safari auto-zoom on focus.
                "flex-1 bg-transparent text-base font-medium min-w-0",
                "outline-none placeholder:text-muted-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              )}
              aria-label="Describe what you ate"
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

          {/* ── Log history button ─────────────────────────────── */}
          <div className="flex items-center justify-start w-full gap-1">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className={cn(
                "touch-hitbox flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-full border transition-colors",
                showHistory
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-subtle text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
              )}>
              <History size={13} />
              Log history
            </button>
          </div>
        </div>
      </div>

      {/* ── History drawer ─────────────────────────────────────── */}
      {showHistory && (
        <MealHistoryDrawer
          meals={historyMeals}
          onRepeat={handleRepeatMeal}
          onClose={() => setShowHistory(false)}
        />
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
 * MealHistoryDrawer — past logged meals with "Repeat" action
 * ------------------------------------------------------------------ */
function MealHistoryDrawer({
  meals,
  onRepeat,
  onClose,
}: {
  meals: (Meal & { day: string })[];
  onRepeat: (meal: Meal) => Promise<void>;
  onClose: () => void;
}) {
  const [repeatedIds, setRepeatedIds] = useState<Set<string>>(new Set());
  const [repeatLoading, setRepeatLoading] = useState<string | null>(null);

  const today = todayLocalKey();

  const grouped = useMemo(() => {
    const map = new Map<string, (Meal & { day: string })[]>();
    for (const m of meals) {
      if (!map.has(m.day)) map.set(m.day, []);
      map.get(m.day)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [meals]);

  function formatDay(day: string): string {
    if (day === today) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (day === yKey) return "Yesterday";
    const d = new Date(day + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const mealTimeColors: Record<string, string> = {
    breakfast: "text-amber-500",
    lunch: "text-amber-500",
    dinner: "text-violet-500",
    snack: "text-sky-500",
  };

  async function handleRepeat(meal: Meal) {
    if (repeatLoading) return;
    setRepeatLoading(meal.id);
    try {
      await onRepeat(meal);
      setRepeatedIds((prev) => new Set(prev).add(meal.id));
    } finally {
      setRepeatLoading(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History size={14} className="text-primary" />
          Log History
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 py-2" data-lenis-prevent>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <Utensils size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No meals logged yet. Start tracking!
            </p>
          </div>
        ) : (
          grouped.map(([day, dayMeals]) => (
            <div key={day} className="px-3 py-1">
              <div className="flex items-center gap-2 py-1.5">
                <Calendar size={11} className="text-muted-foreground/60" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {formatDay(day)}
                </span>
              </div>
              <div className="space-y-1.5">
                {dayMeals.map((meal) => {
                  const isRepeated = repeatedIds.has(meal.id);
                  return (
                    <div
                      key={meal.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-subtle border border-border/60 hover:border-border/80 transition-colors">
                      <Utensils
                        size={12}
                        className={cn(
                          "shrink-0",
                          mealTimeColors[meal.time] ?? "text-muted-foreground",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {meal.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {meal.time} · {meal.cal} kcal · P{meal.p} C{meal.c} F
                          {meal.f}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={repeatLoading === meal.id}
                        onClick={() => handleRepeat(meal)}
                        aria-label={
                          isRepeated
                            ? `${meal.name} repeated`
                            : `Repeat ${meal.name} for today`
                        }
                        className={cn(
                          "shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95",
                          isRepeated
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            : "bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15",
                          repeatLoading === meal.id &&
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
                                repeatLoading === meal.id && "animate-spin",
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

/* ------------------------------------------------------------------
 * MessageBubble
 * ------------------------------------------------------------------ */
function MessageBubble({
  message,
  onConfirm,
  onEdit,
  onDismiss,
  isLogging,
  dismissed,
}: {
  message: ChatMessage;
  onConfirm: () => void;
  onEdit: (meal: PendingMeal) => void;
  onDismiss: () => void;
  isLogging: boolean;
  dismissed: boolean;
}) {
  const isUser = message.role === "user";

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

      {!isUser && message.meal && !dismissed && (
        <div className="w-full max-w-[90%] relative group">
          <MealConfirmationCard
            meal={message.meal}
            onConfirm={onConfirm}
            onEdit={() => {
              const m = message.meal;
              if (m) onEdit(m);
            }}
            isLogging={isLogging}
          />
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLogging}
            aria-label="Discard this meal estimate"
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
