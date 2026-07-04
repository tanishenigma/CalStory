"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uid } from "@/app/context/AppContext";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
import type {
  ChatMessage,
  WorkoutChatMessage,
  PendingMeal,
  PendingWorkout,
} from "@/app/types";

/* ------------------------------------------------------------------
 * useAIFabChat — drives the global FAB chat panel.
 *
 * Unlike the food/workout-specific loggers (which sit on the nutrition
 * or workout page and know the intent up-front), the FAB chat has to
 * figure out on every turn whether the user just described a meal or
 * a workout. We do that with a tiny pre-classifier round-trip:
 *
 *   user text ──► /api/ai-classify ──► intent ──► /api/ai-log-food or /api/ai-log-workout
 *
 * The full message thread is rendered as a single timeline with a
 * small badge per model message ("Food" or "Workout") so the user
 * can see at a glance which pipeline interpreted which turn.
 *
 * Confirmation is also dispatched by intent: the most recent model
 * message that produced a structured payload (meal OR workout) wins.
 * ------------------------------------------------------------------ */
export type FabIntent = "food" | "workout";

export type FabMessage =
  | {
      id: string;
      role: "user";
      text: string;
      intent?: FabIntent; // set after classification round-trip
      timestamp: number;
    }
  | {
      id: string;
      role: "model";
      text: string;
      intent: FabIntent;
      meal?: PendingMeal | null;
      workout?: PendingWorkout | null;
      askSaveTemplate?: boolean;
      suggestions?: string[];
      timestamp: number;
      /** When true, the model reply is a transient informational note
       *  (e.g. "Hmm, I couldn't reach the AI"). It does not block
       *  the next send and shouldn't be considered for confirmation. */
      transient?: boolean;
    };

function uid2() {
  return uid();
}

export function useAIFabChat({
  date,
  userId,
}: {
  date: string;
  userId: string;
}) {
  const { addMeal, addWorkout, saveTemplate } = useApp();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<FabMessage[]>(() => [
    {
      id: uid2(),
      role: "model",
      text: "Hey! Tell me what you ate or how you trained — I'll figure out which log to use. 🥗💪",
      intent: "food", // initial intent slot (no payload yet)
      suggestions: [
        "2 scrambled eggs and toast",
        "Pull-ups 3×12",
        "Protein shake",
        "5km run 25 min",
      ],
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The most recent confirmed intent a model reply produced a
  // structured payload for. confirmLog() targets this so we always
  // log the thing the user just confirmed, even if the thread mixes
  // food and workout turns.
  const [pendingIntent, setPendingIntent] = useState<FabIntent | null>(null);

  // Pending payload — what confirmLog() will save.
  const pendingMeal = useMemo<PendingMeal | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.meal) return m.meal;
    }
    return null;
  }, [messages]);

  const pendingWorkout = useMemo<PendingWorkout | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.workout) return m.workout;
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

  // Build the auth headers once per send (Firebase ID token rotates
  // hourly, so we always pull a fresh token instead of caching).
  const buildHeaders = useCallback(async (): Promise<
    Record<string, string>
  > => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (user) {
      try {
        const token = await getIdToken(user);
        headers["Authorization"] = `Bearer ${token}`;
      } catch {
        // Non-fatal — the server falls back to the env Gemini key.
      }
    }
    return headers;
  }, [user]);

  const classify = useCallback(
    async (text: string): Promise<FabIntent> => {
      const headers = await buildHeaders();
      try {
        const res = await fetch("/api/ai-classify", {
          method: "POST",
          headers,
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok) return "food";
        const data = (await res.json()) as { intent?: FabIntent };
        return data.intent === "workout" ? "workout" : "food";
      } catch {
        // Network down or classifier endpoint missing — food is the
        // safer default and the user can immediately re-ask.
        return "food";
      }
    },
    [buildHeaders],
  );

  // Trim history to just role/content pairs the per-domain endpoints
  // expect. We keep the last 10 turns to keep tokens small.
  const toFoodHistory = useCallback((msgs: FabMessage[]): ChatMessage[] => {
    return msgs.slice(-10).map((m) => {
      if (m.role === "user") {
        return {
          id: m.id,
          role: "user",
          content: m.text,
          timestamp: m.timestamp,
        };
      }
      return {
        id: m.id,
        role: "model",
        content: m.text,
        meal: m.meal ?? null,
        suggestions: m.suggestions ?? [],
        timestamp: m.timestamp,
      };
    });
  }, []);

  const toWorkoutHistory = useCallback(
    (msgs: FabMessage[]): WorkoutChatMessage[] => {
      return msgs.slice(-10).map((m) => {
        if (m.role === "user") {
          return {
            id: m.id,
            role: "user",
            content: m.text,
            timestamp: m.timestamp,
          };
        }
        return {
          id: m.id,
          role: "model",
          content: m.text,
          workout: m.workout ?? null,
          askSaveTemplate: m.askSaveTemplate ?? false,
          suggestions: m.suggestions ?? [],
          timestamp: m.timestamp,
        };
      });
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setError(null);
      const userMsg: FabMessage = {
        id: uid2(),
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Snapshot the messages *before* this turn for history.
      let snapshot: FabMessage[] = [];
      setMessages((prev) => {
        snapshot = prev;
        return prev;
      });

      try {
        // 1. Classify intent (cheap, single-turn).
        const intent = await classify(trimmed);

        // 2. Stamp the intent onto the user message in place.
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, intent } : m)),
        );

        // 3. Dispatch to the per-domain endpoint.
        const headers = await buildHeaders();
        if (intent === "workout") {
          const res = await fetch("/api/ai-log-workout", {
            method: "POST",
            headers,
            body: JSON.stringify({
              message: trimmed,
              conversationHistory: toWorkoutHistory(snapshot),
              userId,
              date,
            }),
          });
          const data = (await res.json()) as {
            message: string;
            workout: PendingWorkout | null;
            askSaveTemplate?: boolean;
            suggestions?: string[];
          };
          const modelMsg: FabMessage = {
            id: uid2(),
            role: "model",
            text: data.message,
            intent: "workout",
            workout: data.workout,
            askSaveTemplate: data.askSaveTemplate ?? false,
            suggestions: data.suggestions ?? [],
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMsg]);
          if (data.workout) setPendingIntent("workout");
        } else {
          const res = await fetch("/api/ai-log-food", {
            method: "POST",
            headers,
            body: JSON.stringify({
              message: trimmed,
              conversationHistory: toFoodHistory(snapshot),
              userId,
              date,
            }),
          });
          const data = (await res.json()) as {
            message: string;
            meal: PendingMeal | null;
            suggestions?: string[];
          };
          const modelMsg: FabMessage = {
            id: uid2(),
            role: "model",
            text: data.message,
            intent: "food",
            meal: data.meal,
            suggestions: data.suggestions ?? [],
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMsg]);
          if (data.meal) setPendingIntent("food");
        }
      } catch (err) {
        console.error("[useAIFabChat] sendMessage error:", err);
        const errMsg: FabMessage = {
          id: uid2(),
          role: "model",
          text: "Something went wrong reaching the AI. Please try again.",
          intent: pendingIntent ?? "food",
          timestamp: Date.now(),
          transient: true,
        };
        setMessages((prev) => [...prev, errMsg]);
        setError("Network error");
      } finally {
        setIsLoading(false);
      }
    },
    [
      classify,
      buildHeaders,
      userId,
      date,
      pendingIntent,
      toFoodHistory,
      toWorkoutHistory,
    ],
  );

  /**
   * Confirm and persist the most-recent pending payload. We branch on
   * the intent that produced the last structured model message so
   * mixed threads log to the right pipeline.
   */
  const confirmLog = useCallback(
    async (saveAsTemplate = false) => {
      // Figure out the right pipeline from the messages themselves
      // (preferred over pendingIntent, which only tracks the latest
      // model message regardless of payload).
      let intent: FabIntent | null = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role !== "model") continue;
        if (m.meal) {
          intent = "food";
          break;
        }
        if (m.workout) {
          intent = "workout";
          break;
        }
      }

      if (intent === "food" && pendingMeal) {
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
        const done: FabMessage = {
          id: uid2(),
          role: "model",
          text: `Logged **${meal.name}** — ${meal.cal} kcal ✅  \nAnything else?`,
          intent: "food",
          suggestions: ["Add a drink", "Log workout", "Done"],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, done]);
        setPendingIntent(null);
        return;
      }

      if (intent === "workout" && pendingWorkout) {
        const exercises = pendingWorkout.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.map((s) => ({ reps: s.reps, kg: s.kg })),
          reps: ex.sets.map((s) => s.reps),
          kg: ex.sets[0]?.kg ?? 0,
        }));
        const workout = {
          id: uid(),
          name: pendingWorkout.name,
          type: pendingWorkout.type,
          duration: pendingWorkout.duration,
          exercises,
          notes: pendingWorkout.notes,
        };
        await addWorkout(workout);
        if (saveAsTemplate) {
          await saveTemplate({
            id: uid(),
            name: workout.name,
            type: workout.type,
            exercises: workout.exercises,
          });
          toast.success(`"${workout.name}" logged & saved as template! 💪`);
        } else {
          toast.success(`"${workout.name}" logged! 💪`);
        }
        const done: FabMessage = {
          id: uid2(),
          role: "model",
          text: `Logged **${workout.name}** — ${workout.exercises.length} exercises ✅  \nAnything else?`,
          intent: "workout",
          suggestions: ["Log another workout", "Log meal", "Done"],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, done]);
        setPendingIntent(null);
        return;
      }

      // Nothing pending — surface a soft hint rather than throwing.
      toast.error("Nothing to log yet — describe a meal or workout first.");
    },
    [messages, pendingMeal, pendingWorkout, addMeal, addWorkout, saveTemplate],
  );

  const reset = useCallback(() => {
    setMessages([
      {
        id: uid2(),
        role: "model",
        text: "Hey! Tell me what you ate or how you trained — I'll figure out which log to use. 🥗💪",
        intent: "food",
        suggestions: [
          "2 scrambled eggs and toast",
          "Pull-ups 3×12",
          "Protein shake",
          "5km run 25 min",
        ],
        timestamp: Date.now(),
      },
    ]);
    setError(null);
    setIsLoading(false);
    setPendingIntent(null);
  }, []);

  // Auto-scroll the message thread (the panel component passes us a
  // ref-less scroll behavior; this hook just exposes the data). The
  // panel itself owns the auto-scroll effect via messages.length.
  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last) lastMessageIdRef.current = last.id;
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    pendingMeal,
    pendingWorkout,
    pendingIntent,
    pendingSuggestions,
    sendMessage,
    confirmLog,
    reset,
  };
}
