"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, ArrowUp } from "lucide-react";
import MealConfirmationCard from "@/app/components/nutrition/meal-confirmation-card";
import { useFoodChat } from "@/app/lib/use-food-chat";
import { cn } from "@/app/lib/utils";
import type { ChatMessage, PendingMeal } from "@/app/types";

interface Props {
  onClose: () => void;
  date: string;
  userId: string;
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
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.165, 0.84, 0.44, 1] }}>
      <div className="mb-8 rounded-md border border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden" style={{ color: "var(--color-ink)" }}>
          {/* ── Message thread ──────────────────────────────────── */}
          <div
            className="h-[340px] overflow-y-auto px-4 py-4 space-y-3"
            data-lenis-prevent>
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
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-primary/10 bg-primary/5 text-foreground/70 hover:border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-foreground transition-all duration-200 whitespace-nowrap">
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
              placeholder="e.g. 8oz Milk & Avocado toast…"
              disabled={isLoading}
              className={cn(
                "flex-1 bg-subtle border border-border rounded-xl",
                "py-2.5 px-3 text-sm font-medium",
                "outline-none focus:border-primary/40",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              )}
              aria-label="Describe what you ate"
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
    </motion.div>
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
