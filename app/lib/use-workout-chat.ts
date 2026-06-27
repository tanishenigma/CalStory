"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { uid } from "@/app/context/AppContext";
import { useApp } from "@/app/context/AppContext";
import { useAuthStore } from "@/app/store/authStore";
import { getIdToken } from "firebase/auth";
import type {
  WorkoutChatMessage,
  WorkoutAIResponse,
  PendingWorkout,
} from "@/app/types";

function makeGreeting(): WorkoutChatMessage {
  return {
    id: uid(),
    role: "model",
    content:
      "Tell me your workout! You can describe it naturally — I'll parse exercises, sets, reps and weights. 💪",
    workout: null,
    suggestions: ["Pull-ups 3×12", "Bench press 80kg 3×10", "5km run 25 min"],
    timestamp: Date.now(),
  };
}

/* ------------------------------------------------------------------
 * useWorkoutChat — manages AI chat state for the AIWorkoutLogger panel.
 * ------------------------------------------------------------------ */
export function useWorkoutChat({
  date,
  userId,
}: {
  date: string;
  userId: string;
}) {
  const { addWorkout, saveTemplate } = useApp();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<WorkoutChatMessage[]>([
    makeGreeting(),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ───────────────────────────────────────────────
  const pendingWorkout = useMemo<PendingWorkout | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.workout) return m.workout;
    }
    return null;
  }, [messages]);

  const askSaveTemplate = useMemo<boolean>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "model" && m.workout) return m.askSaveTemplate ?? false;
    }
    return false;
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

      const userMsg: WorkoutChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

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
        const res = await fetch("/api/ai-log-workout", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: messages.slice(-10),
            userId,
            date,
          }),
        });

        const data: WorkoutAIResponse = await res.json();

        const modelMsg: WorkoutChatMessage = {
          id: uid(),
          role: "model",
          content: data.message,
          workout: data.workout,
          askSaveTemplate: data.askSaveTemplate,
          suggestions: data.suggestions ?? [],
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, modelMsg]);
      } catch (err) {
        console.error("[useWorkoutChat] sendMessage error:", err);
        const errMsg: WorkoutChatMessage = {
          id: uid(),
          role: "model",
          content:
            "Something went wrong. Please check your connection and try again.",
          workout: null,
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
   * Confirm the pending workout — persist it and optionally save as template.
   * When the workout originated from a saved routine and the user opted to
   * "Save changes", we overwrite the existing routine in place rather than
   * creating a duplicate.
   */
  const confirmLog = useCallback(
    async (saveAsTemplate: boolean) => {
      if (!pendingWorkout) return;

      // Find the most recent model message — it carries the source
      // saved-routine id (if any) for "Save changes" behaviour.
      const sourceMsg = [...messages]
        .reverse()
        .find((m) => m.role === "model" && m.workout);
      const sourceRoutineId = (
        sourceMsg as { savedRoutineId?: string } | undefined
      )?.savedRoutineId;

      const exercises = pendingWorkout.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets.map((s) => ({ reps: s.reps, kg: s.kg })),
        // Legacy fields kept for compatibility with existing Workout type
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
        // Reuse the source routine id so the user is editing in place,
        // not creating a duplicate template.
        await saveTemplate({
          id: sourceRoutineId ?? uid(),
          name: workout.name,
          type: workout.type,
          exercises: workout.exercises,
        });
        if (sourceRoutineId) {
          toast.success(`"${workout.name}" logged and routine updated! 💪`);
        } else {
          toast.success(`"${workout.name}" logged and saved as template! 💪`);
        }
      } else {
        toast.success(`"${workout.name}" logged! 💪`);
      }

      const doneMsg: WorkoutChatMessage = {
        id: uid(),
        role: "model",
        content: `Logged **${workout.name}** — ${workout.exercises.length} exercises ✅  \nAnything else to add?`,
        workout: null,
        suggestions: ["Log another workout", "Add notes", "Done for now"],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, doneMsg]);
    },
    [pendingWorkout, addWorkout, saveTemplate, messages],
  );

  const reset = useCallback(() => {
    setMessages([makeGreeting()]);
    setError(null);
    setIsLoading(false);
  }, []);

  const loadRoutine = useCallback(
    (routine: PendingWorkout, routineName: string, savedRoutineId?: string) => {
      setError(null);
      const modelMsg: WorkoutChatMessage & {
        fromSavedRoutine?: boolean;
        savedRoutineId?: string;
      } = {
        id: uid(),
        role: "model",
        content: `Loaded **${routineName}** — review the exercises below and tap Save.`,
        workout: routine,
        // Don't ask the AI for template suggestion when we already know
        // it came from a saved routine.
        askSaveTemplate: false,
        suggestions: ["Edit exercises", "Save & log", "Done for now"],
        timestamp: Date.now(),
        fromSavedRoutine: true,
        savedRoutineId,
      };
      setMessages((prev) => [...prev, modelMsg]);
    },
    [],
  );

  return {
    messages,
    isLoading,
    error,
    pendingWorkout,
    askSaveTemplate,
    pendingSuggestions,
    sendMessage,
    confirmLog,
    reset,
    loadRoutine,
  };
}
