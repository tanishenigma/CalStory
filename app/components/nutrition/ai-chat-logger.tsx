"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Mic, X, ArrowUp } from "lucide-react";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import { useFoodChat } from "@/app/lib/use-food-chat";
import { cn } from "@/app/lib/utils";
import type { ChatMessage, PendingMeal } from "@/app/types";
import BorderGlow from "@/app/components/BorderGlow";

interface Props {
  onClose: () => void;
  /** The currently selected nutrition date (YYYY-MM-DD). */
  date: string;
  /** Firebase user ID — forwarded to the API route. */
  userId: string;
  /**
   * Called when the user clicks "Edit" on a confirmation card.
   * The parent page can open ManualFoodEntry pre-filled with this data.
   */
  onEditMeal?: (meal: PendingMeal) => void;
}

/* ------------------------------------------------------------------
 * AIChatLogger — inline chat panel embedded directly on the page.
 * Appears below the button row, same pattern as ManualFoodEntry.
 * ------------------------------------------------------------------ */
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

  return (
    <BorderGlow
      className="mb-8 animate-in slide-in-from-top-4 duration-300"
      borderRadius={16}
      glowColor="25 95 53"
      colors={["#f97316", "#fb923c", "#fdba74"]}
      glowRadius={35}
      glowIntensity={1.2}
      edgeSensitivity={25}
      animated={true}
    >
      <div
        className={cn(
          "rounded-2xl border border-orange-200 dark:border-orange-900/40",
          "bg-card shadow-sm overflow-hidden",
        )}
      >
      {/* ── Header ──────────────────────────────────────────── */}
      {/* <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink leading-tight">
              CalStory AI
            </div>
            <div className="text-[10px] text-muted-foreground-foreground leading-none mt-0.5">
              Describe what you ate
            </div>
          </div>
        </div>

      </div> */}

      {/* ── Message thread ──────────────────────────────────── */}
      <div
        className="h-[340px] overflow-y-auto px-4 py-4 space-y-3"
        data-lenis-prevent
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            isLogging={isLogging}
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
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border border-orange-300 text-orange-600 dark:text-orange-400 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* ── Input row ───────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-border flex gap-2 items-center">
        <input
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
          placeholder="e.g. 2 scrambled eggs and toast…"
          disabled={isLoading}
          className={cn(
            "flex-1 bg-subtle border border-border rounded-xl",
            "py-2.5 px-3 text-sm font-medium",
            "outline-none focus:border-orange-400",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          )}
          aria-label="Describe what you ate"
        />
        <button
          disabled
          aria-label="Voice input (coming soon)"
          className="p-2.5 rounded-xl border border-border text-muted-foreground opacity-40 cursor-not-allowed"
        >
          <Mic size={16} />
        </button>
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
          className={cn(
            "p-2.5 rounded-xl font-bold transition-all",
            "bg-gradient-to-br from-orange-500 to-amber-400 text-white",
            "hover:opacity-90 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <ArrowUp size={16} />
        </button>
      </div>
      </div>
    </BorderGlow>
  );
}

/* ------------------------------------------------------------------
 * MessageBubble
 * ------------------------------------------------------------------ */
function MessageBubble({
  message,
  onConfirm,
  onEdit,
  isLogging,
}: {
  message: ChatMessage;
  onConfirm: () => void;
  onEdit: (meal: PendingMeal) => void;
  isLogging: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-ink text-white dark:bg-[#f7f6f3] dark:text-[#1a1916] rounded-tr-sm"
            : "bg-subtle border border-border text-ink rounded-tl-sm",
        )}
      >
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

      {!isUser && message.meal && (
        <div className="w-full max-w-[85%]">
          <MealConfirmationCard
            meal={message.meal}
            onConfirm={onConfirm}
            onEdit={() => {
              const m = message.meal;
              if (m) onEdit(m);
            }}
            isLogging={isLogging}
          />
        </div>
      )}
    </div>
  );
}
