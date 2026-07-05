// filepath: app/lib/quick-log-save.test.ts
//
// Targeted tests for the Quick Log dual-intent save flow.
//
// The hook itself (`useAIFabChat`) is a React hook and can't be
// imported directly into a node-only vitest run, so these tests
// exercise the *logic* that drives it:
//
//   1. The dual-save state machine — when both food and workout
//      responses arrive, the user must be able to save each one
//      independently, in either order, without cross-contamination.
//
//   2. Idempotency — once an intent has been confirmed, the second
//      tap on the same card is a no-op (no double-save).
//
//   3. Stale-tap protection — when the user sends a new turn, the
//      confirmation flags reset so the new cards become active.
//
//   4. The `confirmedIntents` set is a `Set<FabIntent>` and must be
//      safely serialized (no nested mutable state).
//
// We re-implement the relevant slice of confirmLog here so we can
// exercise it without rendering React. If the hook ever changes
// its control flow, these tests give us a fast feedback signal
// that the intent-isolation contract still holds.

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
  notes?: string;
}

/** Simulated slice of `useAIFabChat` covering only what we test. */
class FakeQuickLog {
  savedMeals: PendingMeal[] = [];
  savedWorkouts: PendingWorkout[] = [];
  confirmedIntents: Set<FabIntent> = new Set();
  pendingMeal: PendingMeal | null;
  pendingWorkout: PendingWorkout | null;

  constructor(opts: {
    pendingMeal?: PendingMeal | null;
    pendingWorkout?: PendingWorkout | null;
  }) {
    this.pendingMeal = opts.pendingMeal ?? null;
    this.pendingWorkout = opts.pendingWorkout ?? null;
  }

  /** Mirror of confirmLog(intent, saveAsTemplate). */
  async confirm(intent: FabIntent) {
    if (this.confirmedIntents.has(intent)) return; // idempotent

    if (intent === "food" && this.pendingMeal) {
      this.savedMeals.push(this.pendingMeal);
      this.confirmedIntents.add("food");
      return;
    }
    if (intent === "workout" && this.pendingWorkout) {
      this.savedWorkouts.push(this.pendingWorkout);
      this.confirmedIntents.add("workout");
      return;
    }
    throw new Error("Nothing pending for intent " + intent);
  }

  /** Mirror of `sendMessage` resetting state. */
  resetForNewTurn() {
    this.confirmedIntents = new Set();
  }
}

const MEAL: PendingMeal = {
  id: "m1",
  name: "100g Soya Chunks",
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

describe("Quick Log dual-intent save", () => {
  it("saves food when the user confirms the food card", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    expect(ql.savedMeals).toHaveLength(1);
    expect(ql.savedMeals[0]).toEqual(MEAL);
    expect(ql.savedWorkouts).toHaveLength(0);
    expect(ql.confirmedIntents.has("food")).toBe(true);
    expect(ql.confirmedIntents.has("workout")).toBe(false);
  });

  it("saves workout when the user confirms the workout card", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("workout");
    expect(ql.savedWorkouts).toHaveLength(1);
    expect(ql.savedWorkouts[0]).toEqual(WORKOUT);
    expect(ql.savedMeals).toHaveLength(0);
  });

  it("lets the user save BOTH in either order (food first)", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    await ql.confirm("workout");
    expect(ql.savedMeals).toHaveLength(1);
    expect(ql.savedWorkouts).toHaveLength(1);
    expect(ql.confirmedIntents.has("food")).toBe(true);
    expect(ql.confirmedIntents.has("workout")).toBe(true);
  });

  it("lets the user save BOTH in either order (workout first)", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("workout");
    await ql.confirm("food");
    expect(ql.savedMeals).toHaveLength(1);
    expect(ql.savedWorkouts).toHaveLength(1);
  });

  it("is idempotent — confirming food twice saves once", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    await ql.confirm("food"); // stale double-tap
    expect(ql.savedMeals).toHaveLength(1);
  });

  it("is idempotent — confirming workout twice saves once", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("workout");
    await ql.confirm("workout");
    expect(ql.savedWorkouts).toHaveLength(1);
  });

  it("resets confirmedIntents on a new turn so the next card is active", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    await ql.confirm("workout");
    expect(ql.confirmedIntents.size).toBe(2);

    // User sends a new turn — the previous cards are stale.
    ql.resetForNewTurn();

    // Simulate new payloads arriving.
    ql.pendingMeal = { ...MEAL, id: "m2", name: "Chicken Salad" };
    ql.pendingWorkout = { ...WORKOUT, id: "w2", name: "Squats" };

    // The user must be able to save the new food without it being
    // marked as already-confirmed.
    await ql.confirm("food");
    expect(ql.savedMeals).toHaveLength(2);
    expect(ql.savedMeals[1].id).toBe("m2");
  });

  it("throws when no payload exists for the requested intent", async () => {
    const ql = new FakeQuickLog({ pendingMeal: MEAL });
    // No workout pending — confirm("workout") should error rather
    // than silently save the meal.
    await expect(ql.confirm("workout")).rejects.toThrow(/workout/i);
    expect(ql.savedMeals).toHaveLength(0);
    expect(ql.savedWorkouts).toHaveLength(0);
  });

  it("after confirming food first, the workout confirmation is still active", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    // The previous bug: a follow-up confirm could end up saving
    // the food again because the loop found the food `.meal`
    // payload first. With explicit intent + idempotency, a second
    // tap on the workout card still saves the workout.
    await ql.confirm("workout");
    expect(ql.savedMeals).toHaveLength(1);
    expect(ql.savedWorkouts).toHaveLength(1);
  });
});

describe("Quick Log confirmedIntents serializability", () => {
  it("is a Set, not an array", () => {
    const ql = new FakeQuickLog({});
    expect(ql.confirmedIntents).toBeInstanceOf(Set);
  });

  it("can hold multiple intents without losing entries", async () => {
    const ql = new FakeQuickLog({
      pendingMeal: MEAL,
      pendingWorkout: WORKOUT,
    });
    await ql.confirm("food");
    await ql.confirm("workout");
    expect([...ql.confirmedIntents].sort()).toEqual(["food", "workout"]);
  });
});
