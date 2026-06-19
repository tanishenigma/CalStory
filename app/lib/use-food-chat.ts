"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { uid } from "@/app/context/AppContext";
import { useApp } from "@/app/context/AppContext";
import type { ChatMessage, AIResponse, PendingMeal } from "@/app/types";

/* ------------------------------------------------------------------
 * Initial greeting message shown when the panel opens.
 * ------------------------------------------------------------------ */
function makeGreeting(): ChatMessage {
  return {
    id: uid(),
    role: "model",
    content:
      "Hey! Tell me what you ate and I'll estimate the calories and macros for you. 🥗",
    meal: null,
    suggestions: ["2 scrambled eggs", "Chicken rice bowl", "Protein shake"],
    timestamp: Date.now(),
  };
}

/* ------------------------------------------------------------------
 * useFoodChat — manages all AI chat state for the AIChatLogger panel.
 *
 * Props:
 *   date    – the currently selected nutrition date (YYYY-MM-DD)
 *   userId  – Firebase uid for the API call
 * ------------------------------------------------------------------ */
export function useFoodChat({
  date,
  userId,
}: {
  date: string;
  userId: string;
}) {
  const { addMeal } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([makeGreeting()]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ───────────────────────────────────────────────
  /**
   * The most recent model message that has a confirmed meal candidate.
   * Drives the `<MealConfirmationCard>` render.
   */
  const pendingMeal = useMemo<PendingMeal | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.meal) return m.meal;
    }
    return null;
  }, [messages]);

  /**
   * Suggestion chips from the same message as `pendingMeal`, or from
   * the last model message that has suggestions.
   */
  const pendingSuggestions = useMemo<string[]>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.suggestions?.length) return m.suggestions;
    }
    return [];
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────
  /** Send a user message to the AI and append the model's reply. */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      // Optimistic append
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/ai-log-food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            // Send the last 10 turns as context (avoids overly long prompts)
            conversationHistory: messages.slice(-10),
            userId,
            date,
          }),
        });

        const data: AIResponse = await res.json();

        const modelMsg: ChatMessage = {
          id: uid(),
          role: "model",
          content: data.message,
          meal: data.meal,
          suggestions: data.suggestions ?? [],
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, modelMsg]);
      } catch (err) {
        console.error("[useFoodChat] sendMessage error:", err);
        const errMsg: ChatMessage = {
          id: uid(),
          role: "model",
          content:
            "Something went wrong reaching the AI. Please check your connection and try again.",
          meal: null,
          suggestions: [],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setError("Network error");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, userId, date],
  );

  /**
   * Confirm the pending meal — persist it via AppContext, show a toast,
   * and append a final "logged" model message.
   */
  const confirmLog = useCallback(async () => {
    if (!pendingMeal) return;

    const meal = {
      id: uid(),
      name: pendingMeal.name,
      time: pendingMeal.time,
      cal: pendingMeal.cal,
      p: pendingMeal.p,
      c: pendingMeal.c,
      f: pendingMeal.f,
    };

    await addMeal(meal);
    toast.success(`"${meal.name}" logged! 🎉`);

    const doneMsg: ChatMessage = {
      id: uid(),
      role: "model",
      content: `Logged **${meal.name}** — ${meal.cal} kcal ✅  \nAnything else to add?`,
      meal: null,
      suggestions: ["Add a drink", "Log another meal", "Done for now"],
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, doneMsg]);
  }, [pendingMeal, addMeal]);

  /** Reset the chat to the initial greeting. */
  const reset = useCallback(() => {
    setMessages([makeGreeting()]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    pendingMeal,
    pendingSuggestions,
    sendMessage,
    confirmLog,
    reset,
  };
}
