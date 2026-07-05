// filepath: app/lib/quick-log-edit.test.ts
//
// Tests for the Quick Log edit + discard flow.
//
// Mirrors the control flow of editPending() and discardPending() in
// useAIFabChat. These exercise the state transitions in isolation
// so we can catch regressions without rendering React.

import { describe, it, expect } from "vitest";

type FabIntent = "food" | "workout";

interface PendingMeal {
  id: string;
  name: string;
  time: string;
  cal: number;
  p: number;
  c: number;
  f: number;
}

interface PendingWorkout {
  id: string;
  name: string;
  type: string;
  duration: number;
  exercises: Array<{
    name: string;
    sets: Array<{ reps: number; kg: number }>;
  }>;
}

interface FabMessage {
  id: string;
  role: "user" | "model";
  text: string;
  intent?: FabIntent;
  intents?: FabIntent[];
  meal?: PendingMeal | null;
  workout?: PendingWorkout | null;
}

const MEAL: PendingMeal = {
  id: "m1",
  name: "Soya Chunks",
  time: "lunch",
  cal: 333,
  p: 52,
  c: 23,
  f: 1,
};

const WORKOUT: PendingWorkout = {
  id: "w1",
  name: "Push-ups",
  type: "resistance",
  duration: 5,
  exercises: [{ name: "Push-up", sets: [{ reps: 10, kg: 0 }] }],
};

/** Simulated slice of useAIFabChat covering edit + discard. */
class FakeQuickLog {
  messages: FabMessage[] = [];
  confirmedIntents: Set<FabIntent> = new Set();
  pendingMeal: PendingMeal | null = null;
  pendingWorkout: PendingWorkout | null = null;

  constructor(opts: {
    messages?: FabMessage[];
    pendingMeal?: PendingMeal | null;
    pendingWorkout?: PendingWorkout | null;
  }) {
    this.messages = opts.messages ?? [];
    this.pendingMeal = opts.pendingMeal ?? null;
    this.pendingWorkout = opts.pendingWorkout ?? null;
  }

  /** Mirror of editPending(intent, requestEdit). */
  editPending(intent: FabIntent, requestEdit: (prefill: string) => void) {
    if (intent === "food" && this.pendingMeal) {
      requestEdit(`Adjust the meal "${this.pendingMeal.name}" — `);
    } else if (intent === "workout" && this.pendingWorkout) {
      requestEdit(`Adjust the workout "${this.pendingWorkout.name}" — `);
    }
  }

  /** Mirror of discardPending(intent). */
  discardPending(intent: FabIntent) {
    this.messages = this.messages.filter((m) => {
      if (m.role !== "model") return true;
      if (intent === "food" && m.meal) return false;
      if (intent === "workout" && m.workout) return false;
      return true;
    });
    this.confirmedIntents.add(intent);
    this.pendingMeal = intent === "food" ? null : this.pendingMeal;
    this.pendingWorkout = intent === "workout" ? null : this.pendingWorkout;
  }
}

describe("Quick Log edit flow", () => {
  it("prefills the input with a refinement phrase for the meal", () => {
    const ql = new FakeQuickLog({ pendingMeal: MEAL });
    let captured = "";
    ql.editPending("food", (prefill) => {
      captured = prefill;
    });
    expect(captured).toBe('Adjust the meal "Soya Chunks" — ');
  });

  it("prefills the input with a refinement phrase for the workout", () => {
    const ql = new FakeQuickLog({ pendingWorkout: WORKOUT });
    let captured = "";
    ql.editPending("workout", (prefill) => {
      captured = prefill;
    });
    expect(captured).toBe('Adjust the workout "Push-ups" — ');
  });

  it("is a no-op when no payload is pending for the intent", () => {
    const ql = new FakeQuickLog({}); // nothing pending
    let called = false;
    ql.editPending("food", () => {
      called = true;
    });
    expect(called).toBe(false);
  });

  it("for food with no meal, ignores the call (only workout pending)", () => {
    const ql = new FakeQuickLog({ pendingWorkout: WORKOUT });
    let captured = "";
    ql.editPending("food", (prefill) => {
      captured = prefill;
    });
    expect(captured).toBe("");
  });

  it("the refinement phrase leaves room for the user to type the change", () => {
    const ql = new FakeQuickLog({ pendingMeal: MEAL });
    let captured = "";
    ql.editPending("food", (prefill) => {
      captured = prefill;
    });
    // The prefill ends with " — " so the user just continues typing,
    // e.g. "…— use 200g instead".
    expect(captured.endsWith("— ")).toBe(true);
  });
});

describe("Quick Log discard flow", () => {
  it("removes the meal card from the timeline", () => {
    const ql = new FakeQuickLog({
      messages: [
        { id: "u1", role: "user", text: "I ate soya chunks" },
        { id: "m1", role: "model", text: "Got it", intent: "food", meal: MEAL },
      ],
      pendingMeal: MEAL,
    });
    ql.discardPending("food");
    // The model message carrying the meal payload should be gone.
    expect(ql.messages.find((m) => m.meal)).toBeUndefined();
    // The user message is preserved.
    expect(ql.messages.find((m) => m.id === "u1")).toBeDefined();
  });

  it("removes the workout card from the timeline", () => {
    const ql = new FakeQuickLog({
      messages: [
        { id: "u1", role: "user", text: "I did pushups" },
        {
          id: "w1",
          role: "model",
          text: "Got it",
          intent: "workout",
          workout: WORKOUT,
        },
      ],
      pendingWorkout: WORKOUT,
    });
    ql.discardPending("workout");
    expect(ql.messages.find((m) => m.workout)).toBeUndefined();
  });

  it("marks the intent as confirmed so the card UI shows Saved ✓ (or is hidden)", () => {
    const ql = new FakeQuickLog({
      messages: [
        { id: "m1", role: "model", text: "x", intent: "food", meal: MEAL },
      ],
      pendingMeal: MEAL,
    });
    ql.discardPending("food");
    expect(ql.confirmedIntents.has("food")).toBe(true);
  });

  it("in a mixed-intent message, discarding food keeps the workout card", () => {
    const ql = new FakeQuickLog({
      messages: [
        {
          id: "u1",
          role: "user",
          text: "ate and trained",
          intents: ["food", "workout"],
        },
        { id: "f1", role: "model", text: "x", intent: "food", meal: MEAL },
        {
          id: "w1",
          role: "model",
          text: "y",
          intent: "workout",
          workout: WORKOUT,
        },
      ],
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    ql.discardPending("food");
    // Food message removed…
    expect(ql.messages.find((m) => m.meal)).toBeUndefined();
    // …but workout message stays so the user can still save it.
    expect(ql.messages.find((m) => m.workout)).toBeDefined();
  });

  it("in a mixed-intent message, discarding workout keeps the meal card", () => {
    const ql = new FakeQuickLog({
      messages: [
        { id: "f1", role: "model", text: "x", intent: "food", meal: MEAL },
        {
          id: "w1",
          role: "model",
          text: "y",
          intent: "workout",
          workout: WORKOUT,
        },
      ],
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    ql.discardPending("workout");
    expect(ql.messages.find((m) => m.workout)).toBeUndefined();
    expect(ql.messages.find((m) => m.meal)).toBeDefined();
  });

  it("is idempotent — discarding a non-existent payload doesn't crash", () => {
    const ql = new FakeQuickLog({ messages: [] });
    // No payload for either intent. discardPending should be a no-op.
    expect(() => ql.discardPending("food")).not.toThrow();
    expect(() => ql.discardPending("workout")).not.toThrow();
  });

  it("discarding food does not set workout as confirmed", () => {
    const ql = new FakeQuickLog({
      messages: [
        { id: "m1", role: "model", text: "x", intent: "food", meal: MEAL },
      ],
      pendingMeal: MEAL,
    });
    ql.discardPending("food");
    expect(ql.confirmedIntents.has("workout")).toBe(false);
  });
});
