"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { uid } from "@/app/context/AppContext";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
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
    suggestions: ["Greek yogurt with granola and berries", "Veggie burrito bowl", "Protein shake"],
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
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<ChatMessage[]>([makeGreeting()]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ───────────────────────────────────────────────

  const pendingMeal = useMemo<PendingMeal | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.meal) return m.meal;
    }
    return null;
  }, [messages]);

  const pendingSuggestions = useMemo<string[]>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.suggestions?.length) return m.suggestions;
    }
    return [];
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────

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
        // Attach the Firebase ID token so the server can read the user's
        // personal Gemini API key from Firestore via the REST API.
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (user) {
          try {
            const token = await getIdToken(user);
            headers["Authorization"] = `Bearer ${token}`;
          } catch {
            // Non-fatal — falls back to env key
          }
        }
        const res = await fetch("/api/ai-log-food", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmed,
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
