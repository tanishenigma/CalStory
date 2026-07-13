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
  Clock,
  ChevronRight,
  MessageSquare,
  Calendar,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import WorkoutConfirmationCard from "@/app/components/nutrition/workout-confirmation-card";
import {
  useAIFabChat,
  type FabIntent,
  type FabMessage,
  type ChatSession,
} from "@/app/lib/use-ai-fab-chat";
import { cn } from "@/app/lib/utils";
import { todayLocalKey, uid } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { useApp } from "@/app/context/AppContext";
import type { Meal, SavedWorkout } from "@/app/types";
import { toast } from "sonner";

/* ------------------------------------------------------------------
 * AIFabChat — the panel that opens when the user taps the global FAB.
 *
 * Height contract (mobile-first):
 *   • Outer panel: fixed h-[min(76dvh,600px)] — never shifts
 *   • Header:      44px fixed
 *   • Body zone:   flex-1, overflow-hidden — contains either the chat
 *                  thread or an open drawer; both fill this same space
 *   • Input row:   auto-height, always anchored to the bottom
 * ------------------------------------------------------------------ */

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
    label: "Greek yogurt with granola and berries",
    icon: Utensils,
    prefill: "Greek yogurt with granola and berries",
  },
  {
    label: "Pull-ups 3×12",
    icon: Dumbbell,
    prefill: "Pull-ups 3×12",
  },
  { label: "Protein shake", icon: Coffee, prefill: "Protein shake" },
  { label: "5km run 25 min", icon: Flame, prefill: "5km run 25 min" },
];

type DrawerType = "history" | "template" | "sessions" | null;

interface Props {
  onClose: () => void;
}

export default function AIFabChat({ onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.uid ?? "anonymous";
  const date = todayLocalKey();
  const { state, addMeal } = useApp();

  const {
    messages,
    isLoading,
    pendingMeal,
    pendingWorkout,
    pendingSuggestions,
    confirmedIntents,
    sessions,
    sendMessage,
    confirmLog,
    editPending,
    discardPending,
    reset,
    switchSession,
  } = useAIFabChat({ date, userId });

  const [inputValue, setInputValue] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  /** Quick-action chip: send immediately — no prefill. */
  async function handleQuickAction(prefill: string) {
    if (isLoading) return;
    await sendMessage(prefill);
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
    // Close any open drawer so the chat thread becomes visible.
    setActiveDrawer(null);
    setInputValue("");
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

  function handleUseTemplate(template: SavedWorkout) {
    setActiveDrawer(null);
    const msg = `Log workout: ${template.name} — ${template.exercises.map((e) => e.name).join(", ")}`;
    handleSend(msg);
  }

  function handleSwitchSession(session: ChatSession) {
    setActiveDrawer(null);
    switchSession(session.id);
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
  }

  const isEmpty = messages.length === 0;

  // Collect all meals from state (past 30 days, most recent first)
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

  return (
    /*
     * The outer wrapper has a **fixed** height so the panel never
     * resizes when switching between drawers and the chat thread.
     * We cap it at 600px for large screens and use dvh on mobile
     * so the browser toolbar doesn't cause a layout shift.
     */
    <div
      className={cn(
        "w-[min(94vw,380px)] flex flex-col",
        // Fixed total height — never shifts
        "h-[min(76dvh,600px)]",
        "rounded-3xl border border-border",
        "bg-card",
        "shadow-[0_2px_8px_oklch(0_0_0/_0.05),0_12px_24px_oklch(0_0_0/_0.06)]",
        "hover:shadow-[0_4px_12px_oklch(0_0_0/_0.08),0_20px_40px_oklch(0_0_0/_0.10)]",
        "transition-shadow duration-200",
        "overflow-hidden",
      )}>

      {/* ── Header (fixed ~44px) ────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-3 sm:px-4 py-3 border-b border-border/60 shrink-0">
        <button
          type="button"
          onClick={() =>
            setActiveDrawer(activeDrawer === "sessions" ? null : "sessions")
          }
          aria-label="Past conversations"
          className="touch-hitbox absolute left-3 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              activeDrawer === "sessions" && "rotate-180",
            )}
          />
        </button>

        <div className="text-sm font-bold font-heading text-foreground">
          Quick Log
        </div>

        <div className="absolute right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { reset(); setActiveDrawer(null); }}
            aria-label="Start a new chat"
            className="touch-hitbox w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors">
            <SquarePen size={14} />
          </button>
        </div>
      </div>

      {/* ── Body zone — fills all available space between header and
           input row. Always the same height regardless of which
           drawer (or the chat thread) is displayed. ─────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Drawer: rendered above the chat when open */}
        {activeDrawer && (
          <div className="flex-1 flex flex-col overflow-hidden border-b border-border/40">
            {activeDrawer === "history" && (
              <HistoryDrawer
                meals={historyMeals}
                onRepeat={handleRepeatMeal}
                onClose={() => setActiveDrawer(null)}
              />
            )}
            {activeDrawer === "template" && (
              <TemplateDrawer
                templates={state.savedWorkouts}
                onUse={handleUseTemplate}
                onClose={() => setActiveDrawer(null)}
              />
            )}
            {activeDrawer === "sessions" && (
              <SessionDrawer
                sessions={sessions}
                onSwitch={handleSwitchSession}
                onClose={() => setActiveDrawer(null)}
              />
            )}
          </div>
        )}

        {/* Chat thread / greeting — always mounted so scroll position
             is preserved; hidden visually when a drawer is open */}
        <div
          className={cn(
            "flex-1 min-h-0 flex flex-col overflow-hidden",
            activeDrawer && "hidden",
          )}>
          {isEmpty ? (
            /* ── Empty greeting state ─────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 sm:px-6 py-6 text-center overflow-y-auto">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-sm shrink-0">
                <Sparkles size={19} />
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold font-heading leading-tight">
                  Hey there!
                </div>
                <div className="text-sm text-muted-foreground leading-snug">
                  Tap a quick action to log it instantly, or type anything.
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 w-full">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickAction(action.prefill)}
                      className={cn(
                        "flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-2xl min-h-[44px]",
                        "border border-border bg-subtle",
                        "text-xs font-semibold text-foreground/80",
                        "hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
                        "active:scale-95 transition-all duration-150",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}>
                      <Icon size={14} className="text-primary shrink-0" />
                      <span className="whitespace-nowrap">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Message thread ───────────────────────────────── */
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 sm:px-3.5 py-3 space-y-3"
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

          {/* Suggestion chips — only shown in chat mode */}
          {pendingSuggestions.length > 0 && !isLoading && !isEmpty && (
            <div className="px-3 sm:px-3.5 pb-2 flex flex-wrap justify-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* ── Input row (always anchored to bottom) ────────────────── */}
      <div
        className="shrink-0 px-3 sm:px-3.5 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex flex-col items-center gap-2 rounded-[28px] border border-border bg-subtle pl-4 pr-2 py-2.5 min-h-[52px]">
          <div className="flex items-end gap-2 w-full">
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
            {/* Mobile send/mic — hidden on md+ where they appear in the row below */}
            <button
              disabled
              aria-label="Voice input (coming soon)"
              className="touch-hitbox p-2.5 rounded-full text-muted-foreground opacity-40 cursor-not-allowed shrink-0 md:hidden">
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
                "disabled:opacity-40 disabled:cursor-not-allowed md:hidden",
              )}>
              <ArrowUp size={18} />
            </button>
          </div>

          {/* ── Use template / Log history / md send row ─────────── */}
          <div className="flex items-center justify-start w-full gap-1">
            <button
              type="button"
              onClick={() =>
                setActiveDrawer(
                  activeDrawer === "template" ? null : "template",
                )
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
                setActiveDrawer(
                  activeDrawer === "history" ? null : "history",
                )
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
 * HistoryDrawer — past logged meals with "Repeat for today" action
 * ------------------------------------------------------------------ */
function HistoryDrawer({
  meals,
  onRepeat,
  onClose,
}: {
  meals: (Meal & { day: string })[];
  onRepeat: (meal: Meal) => Promise<void>;
  onClose: () => void;
}) {
  /** Track which meal IDs have been repeated this session. */
  const [repeatedIds, setRepeatedIds] = useState<Set<string>>(new Set());
  const [repeatLoading, setRepeatLoading] = useState<string | null>(null);

  const today = todayLocalKey();

  // Group by day
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
    lunch: "text-emerald-500",
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
      {/* Drawer header */}
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

      {/* Scrollable meal list */}
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
              {/* Day header */}
              <div className="flex items-center gap-2 py-1.5">
                <Calendar size={11} className="text-muted-foreground/60" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {formatDay(day)}
                </span>
              </div>

              {/* Meal rows */}
              <div className="space-y-1.5">
                {dayMeals.map((meal) => {
                  const isRepeated = repeatedIds.has(meal.id);
                  const isRepeatPast = day === today; // already today — still allow repeat
                  void isRepeatPast;
                  return (
                    <div
                      key={meal.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-subtle border border-border/60 hover:border-border/80 transition-colors">
                      {/* Left: icon + name */}
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
                          {meal.time} · {meal.cal} kcal · P{meal.p} C{meal.c} F{meal.f}
                        </p>
                      </div>

                      {/* Right: Repeat button */}
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
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            : "bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15",
                          repeatLoading === meal.id && "opacity-60 cursor-not-allowed",
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
 * TemplateDrawer — saved workout templates
 * ------------------------------------------------------------------ */
function TemplateDrawer({
  templates,
  onUse,
  onClose,
}: {
  templates: SavedWorkout[];
  onUse: (t: SavedWorkout) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText size={14} className="text-primary" />
          Templates
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 py-2" data-lenis-prevent>
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <Dumbbell size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No templates yet. Save a workout as a template to find it here!
            </p>
          </div>
        ) : (
          <div className="px-3 py-1 space-y-1.5">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onUse(template)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-subtle border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 group text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
                    <Dumbbell size={13} className="text-sky-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[190px]">
                      {template.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {template.type} · {template.exercises.length} exercise
                      {template.exercises.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * SessionDrawer — past chat sessions
 * ------------------------------------------------------------------ */
function SessionDrawer({
  sessions,
  onSwitch,
  onClose,
}: {
  sessions: ChatSession[];
  onSwitch: (s: ChatSession) => void;
  onClose: () => void;
}) {
  function formatTime(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageSquare size={14} className="text-primary" />
          Past Chats
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 py-2" data-lenis-prevent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
            <MessageSquare size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No past chats yet. Sessions save automatically!
            </p>
          </div>
        ) : (
          <div className="px-3 py-1 space-y-1.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSwitch(session)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-subtle border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 group text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare size={13} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[190px]">
                      {session.label}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} className="text-muted-foreground/60" />
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(session.updatedAt)} ·{" "}
                        {session.messages.filter((m) => m.role === "user").length}{" "}
                        message
                        {session.messages.filter((m) => m.role === "user").length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
 * FabMessageBubble
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
