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
    intents?: FabIntent[]; // set after classification round-trip; > 1 means mixed
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
        "Greek yogurt with granola and berries",
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

  // Intents that the user has already confirmed and saved. The UI
  // reads this to know whether the corresponding confirmation card
  // should still be active. Important for mixed-intent messages
  // where both a meal AND a workout are pending — without this, the
  // second confirm might re-save the first one or, worse, the loop
  // in confirmLog() might pick the wrong intent based on message
  // order.
  const [confirmedIntents, setConfirmedIntents] = useState<Set<FabIntent>>(
    () => new Set(),
  );

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

  // Fast keyword-based intent detector. The LLM classifier is good
  // for ambiguous natural language, but it sometimes defaults to
  // "food" on clear workout inputs ("Pull-ups 3x12", "bench 80kg
  // 3x10", "ran 5km"). For messages that match these patterns we
  // skip the round-trip and route directly to the workout pipeline.
  // This keeps the common case snappy and immune to LLM bias.
  const WORKOUT_KEYWORDS = [
    "pull-up",
    "pullup",
    "push-up",
    "pushup",
    "push up",
    "pull up",
    "chin-up",
    "chinup",
    "bench",
    "squat",
    "deadlift",
    "press",
    "row",
    "curl",
    "lunge",
    "plank",
    "crunch",
    "sit-up",
    "situp",
    "burpee",
    "jumping jack",
    "kettlebell",
    "dumbbell",
    "barbell",
    "rep",
    "reps",
    "set",
    "sets",
    "x12",
    "x10",
    "x8",
    "x15",
    "x20",
    "x5",
    "x3",
    "kg",
    "lb",
    " lbs",
    "×",
    "ran ",
    "run ",
    "running",
    "jog",
    "jogged",
    "5k",
    "10k",
    "marathon",
    "treadmill",
    "bike",
    "biked",
    "cycling",
    "swam",
    "swim",
    "swimming",
    "yoga",
    "pilates",
    "hiit",
    "crossfit",
    "wod",
    "lifted",
    "lift ",
    "trained",
    "training",
    "workout",
    "exercise",
    "cardio",
    "sport",
    "match",
    "game",
    "tournament",
    "session",
    "repped",
    "max",
    "pr ",
    "1rm",
    "one rep",
    "stairmaster",
    "elliptical",
  ];

  function detectIntentHeuristic(text: string): FabIntent[] {
    const t = text.toLowerCase().trim();
    if (!t) return [];
    const intents: FabIntent[] = [];

    // Set notation like "3x12", "3x10 @ 80kg", "3 sets x 12 reps"
    // is an unambiguous workout pattern. Require a workout keyword
    // alongside so we don't false-positive on food descriptions
    // like "3x protein shakes a day".
    const setNotation =
      /\b\d+\s*[x×@]\s*\d+(\s*(?:kg|lb|lbs|rpe|reps?))?\b/i.test(t);
    const hasWorkoutKeyword = WORKOUT_KEYWORDS.some(
      (k) => t.includes(k) && k.length >= 4,
    );
    if (setNotation && hasWorkoutKeyword) {
      intents.push("workout");
    } else if (hasWorkoutKeyword) {
      intents.push("workout");
    }

    // Food markers — words that strongly imply a meal / snack / drink
    // rather than a workout. Bare numbers like "100g" alone are too
    // weak (workouts can also use grams for plates), so we require a
    // consumable noun too.
    const FOOD_KEYWORDS = [
      "ate",
      "eat",
      "eaten",
      "eating",
      "had",
      "have",
      "drank",
      "drink",
      "drunk",
      "drinking",
      "snack",
      "snacked",
      "meal",
      "breakfast",
      "lunch",
      "dinner",
      "brunch",
      "feast",
      "cheat meal",
      "calories",
      "calorie",
      "kcal",
      "protein",
      "carbs",
      "fat",
      "fats",
      "macro",
      "macros",
      "grams of",
      "g of",
      "cup of",
      "slice of",
      "tbsp",
      "tsp",
      "tablespoon",
      "teaspoon",
      "bowl of",
      "plate of",
      "sandwich",
      "salad",
      "pizza",
      "burger",
      "rice",
      "noodles",
      "pasta",
      "bread",
      "toast",
      "egg",
      "eggs",
      "chicken",
      "beef",
      "pork",
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "tofu",
      "paneer",
      "soya",
      "soy",
      "chuinksi",
      "chunki",
      "protein shake",
      "shake",
      "smoothie",
      "juice",
      "coffee",
      "tea",
      "water",
      "milk",
      "yogurt",
      "yoghurt",
      "cheese",
      "apple",
      "banana",
      "berries",
      "nuts",
      "almond",
      "peanut",
      "oats",
      "granola",
      "cereal",
      "chips",
      "fries",
      "chocolate",
      "candy",
      "ice cream",
      "cookie",
      "cake",
      "wine",
      "beer",
      "whisky",
    ];
    if (FOOD_KEYWORDS.some((k) => t.includes(k))) {
      intents.push("food");
    }

    // Quantity-like "100g X" or "2 cups Y" is a strong food signal
    // even without a keyword match — common in cooking / meal logs.
    if (/\b\d+\s*(g|grams?|oz|ml|l|cup|tbsp|tsp)\b/i.test(t) && !setNotation) {
      if (!intents.includes("food")) intents.push("food");
    }

    return intents;
  }

  const classify = useCallback(
    async (text: string, history: FabMessage[]): Promise<FabIntent[]> => {
      // 1. Heuristic fast-path. Saves a network round-trip and is
      //    immune to the LLM's bias toward "food".
      const heuristic = detectIntentHeuristic(text);
      if (heuristic.length > 0) return heuristic;

      const headers = await buildHeaders();
      // Trim the snapshot down to the role/content pairs the
      // classifier endpoint understands. We only send the last few
      // turns — older context is irrelevant for routing and we want
      // to keep the request small.
      const conversationHistory = history.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      try {
        const res = await fetch("/api/ai-classify", {
          method: "POST",
          headers,
          body: JSON.stringify({ message: text, conversationHistory }),
        });
        if (!res.ok) return ["food"];
        const data = (await res.json()) as { intents?: FabIntent[] };
        if (Array.isArray(data.intents) && data.intents.length > 0) {
          return data.intents.filter(
            (i): i is FabIntent => i === "food" || i === "workout",
          );
        }
        return ["food"];
      } catch {
        // Network down or classifier endpoint missing — food is the
        // safer default and the user can immediately re-ask.
        return ["food"];
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
        // A new turn invalidates any previously-confirmed intents —
        // the cards above are stale now.
        setConfirmedIntents(new Set());

        // 1. Classify intent(s). May return 1 or 2 intents so that
        //    mixed messages like "I ate 100g chicken and did 10
        //    pushups" run BOTH pipelines in parallel.
        const intents = await classify(trimmed, snapshot);

        // 2. Stamp the intents onto the user message in place.
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, intents } : m)),
        );

        // 3. Dispatch to per-domain endpoint(s) in parallel.
        const headers = await buildHeaders();
        const foodPromise = intents.includes("food")
          ? (async () => {
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
          })()
          : Promise.resolve();

        const workoutPromise = intents.includes("workout")
          ? (async () => {
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
          })()
          : Promise.resolve();

        await Promise.all([foodPromise, workoutPromise]);
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
   * Confirm and persist the pending payload for the given intent.
   *
   * Caller MUST pass the explicit intent (`food` or `workout`) —
   * we no longer guess from message order, because mixed-intent
   * sends produce two pending payloads and the wrong one could win
   * a race. Each model's confirmation card passes its own intent
   * in via onConfirmFood / onConfirmWorkout.
   *
   * For mixed-intent turns, the user can save each side separately:
   * tap "Save meal" → confirmLog("food") → food saved.
   * Then tap "Save workout" → confirmLog("workout") → workout saved.
   * Both invocations are independent and idempotent (already-saved
   * intents are no-ops).
   */
  const confirmLog = useCallback(
    async (intent: FabIntent, saveAsTemplate = false) => {
      // Idempotency: if the user (or a stale callback) double-taps,
      // the second call is a no-op.
      if (confirmedIntents.has(intent)) {
        return;
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
        setConfirmedIntents((prev) => {
          const next = new Set(prev);
          next.add("food");
          // Only clear pendingMeal once both intents (if both were
          // pending) are confirmed. We track the previous value
          // via the snapshot argument passed in below.
          return next;
        });
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
        setConfirmedIntents((prev) => new Set(prev).add("workout"));
        return;
      }

      // Nothing pending for this intent — surface a soft hint rather
      // than throwing. (We only error if NEITHER intent has a
      // pending payload.)
      if (!pendingMeal && !pendingWorkout) {
        toast.error("Nothing to log yet — describe a meal or workout first.");
      }
    },
    [
      confirmedIntents,
      pendingMeal,
      pendingWorkout,
      addMeal,
      addWorkout,
      saveTemplate,
    ],
  );

  /**
   * Mark a pending payload as "edit mode": focuses the chat input
   * and prefills it with a refinement prefix so the user can type
   * their correction. The pending payload stays on screen until the
   * user either confirms it or sends a replacement message.
   */
  const editPending = useCallback(
    (intent: FabIntent, requestEdit: (prefill: string) => void) => {
      if (intent === "food" && pendingMeal) {
        requestEdit(`Adjust the meal "${pendingMeal.name}" — `);
      } else if (intent === "workout" && pendingWorkout) {
        requestEdit(`Adjust the workout "${pendingWorkout.name}" — `);
      } else {
        // Nothing pending to edit — ignore silently. The UI button
        // is only shown when a payload exists, so this is just
        // belt-and-suspenders.
      }
    },
    [pendingMeal, pendingWorkout],
  );

  /**
   * Discard a pending payload without saving. Removes the model
   * message containing that payload so the confirmation card goes
   * away. Marks the intent as "confirmed" so the dual-save state
   * machine doesn't try to re-render it (idempotent no-op from now
   * on).
   */
  const discardPending = useCallback((intent: FabIntent) => {
    setMessages((prev) => {
      // Walk from the end and drop the FIRST model message that
      // carries a payload of the matching intent. We only drop one
      // message so other cards (the other intent for mixed turns,
      // or earlier cards) are unaffected.
      for (let i = prev.length - 1; i >= 0; i--) {
        const m = prev[i];
        if (m.role !== "model") continue;
        if (intent === "food" && m.meal) {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
        if (intent === "workout" && m.workout) {
          return [...prev.slice(0, i), ...prev.slice(i + 1)];
        }
      }
      return prev;
    });
    // Marking as "confirmed" makes the card disappear from the UI
    // (the bubble reads `confirmedIntents.has(m.intent)` to decide
    // whether to show "Saved ✓"), and prevents any stale callback
    // from re-saving the now-orphaned payload.
    setConfirmedIntents((prev) => new Set(prev).add(intent));
    setPendingIntent(null);
  }, []);

  const reset = useCallback(() => {
    setMessages([
      {
        id: uid2(),
        role: "model",
        text: "Hey! Tell me what you ate or how you trained — I'll figure out which log to use. 🥗💪",
        intent: "food",
        suggestions: [
          "Greek yogurt with granola and berries",
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
    setConfirmedIntents(new Set());
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
    confirmedIntents,
    sendMessage,
    confirmLog,
    editPending,
    discardPending,
    reset,
  };
}
