import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type {
  Profile,
  Meal,
  Workout,
  SavedWorkout,
  RecentMeal,
} from "@/app/types";

/* ────────────────────────────────────────────────────────────
 * Firestore-only data layer.
 *
 * All reads/writes go directly to Firestore. Errors are caught
 * and returned as null / empty arrays so the app never crashes
 * or gets stuck in a loading state.
 * ──────────────────────────────────────────────────────────── */

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[db] Firestore error:", err);
    return fallback;
  }
}

// ── Profile ──────────────────────────────────────────────
export async function saveProfile(
  uid: string,
  profile: Profile,
): Promise<void> {
  console.log(`[API Request] saveProfile (uid: ${uid})`, profile);
  await safe(async () => {
    await setDoc(
      doc(db, "users", uid),
      { profile, updatedAt: serverTimestamp() },
      { merge: true },
    );
    console.log(`[API Response] saveProfile success`);
  }, undefined);
}

export async function getProfile(uid: string): Promise<Profile | null> {
  console.log(`[API Request] getProfile (uid: ${uid})`);
  return safe(async () => {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      console.log(`[API Response] getProfile (not found in DB)`);
      return null;
    }
    const data = snap.data() as { profile: Profile };
    const profile = data.profile ?? null;
    console.log(`[API Response] getProfile success`, profile);
    return profile;
  }, null);
}

// ── Meals ─────────────────────────────────────────────────
// Path: users/{uid}/meals/{dateKey}/items/{mealId}
export async function saveMeal(
  uid: string,
  dateKey: string,
  meal: Meal,
): Promise<void> {
  console.log(`[API Request] saveMeal (uid: ${uid}, date: ${dateKey})`, meal);
  await safe(async () => {
    const ref = doc(db, "users", uid, "meals", dateKey, "items", meal.id);
    await setDoc(ref, { ...meal, savedAt: serverTimestamp() });
    console.log(`[API Response] saveMeal success`);
  }, undefined);
}

export async function getMeals(uid: string, dateKey: string): Promise<Meal[]> {
  console.log(`[API Request] getMeals (uid: ${uid}, date: ${dateKey})`);
  return safe(async () => {
    const col = collection(db, "users", uid, "meals", dateKey, "items");
    const snap = await getDocs(col);
    const meals = snap.docs.map((d) => d.data() as Meal);
    console.log(`[API Response] getMeals success, got ${meals.length} items`);
    return meals;
  }, [] as Meal[]);
}

export async function deleteMealDB(
  uid: string,
  dateKey: string,
  mealId: string,
): Promise<void> {
  console.log(
    `[API Request] deleteMealDB (uid: ${uid}, date: ${dateKey}, id: ${mealId})`,
  );
  await safe(async () => {
    await deleteDoc(doc(db, "users", uid, "meals", dateKey, "items", mealId));
    console.log(`[API Response] deleteMealDB success`);
  }, undefined);
}

// ── Workouts ──────────────────────────────────────────────
export async function saveWorkout(
  uid: string,
  dateKey: string,
  workout: Workout,
): Promise<void> {
  console.log(
    `[API Request] saveWorkout (uid: ${uid}, date: ${dateKey})`,
    workout,
  );
  await safe(async () => {
    const ref = doc(
      db,
      "users",
      uid,
      "workouts",
      dateKey,
      "sessions",
      workout.id,
    );
    await setDoc(ref, { ...workout, savedAt: serverTimestamp() });
    console.log(`[API Response] saveWorkout success`);
  }, undefined);
}

export async function getWorkouts(
  uid: string,
  dateKey: string,
): Promise<Workout[]> {
  console.log(`[API Request] getWorkouts (uid: ${uid}, date: ${dateKey})`);
  return safe(async () => {
    const col = collection(db, "users", uid, "workouts", dateKey, "sessions");
    const snap = await getDocs(col);
    const workouts = snap.docs.map((d) => d.data() as Workout);
    console.log(
      `[API Response] getWorkouts success, got ${workouts.length} items`,
    );
    return workouts;
  }, [] as Workout[]);
}

export async function deleteWorkoutDB(
  uid: string,
  dateKey: string,
  workoutId: string,
): Promise<void> {
  console.log(
    `[API Request] deleteWorkoutDB (uid: ${uid}, date: ${dateKey}, id: ${workoutId})`,
  );
  await safe(async () => {
    await deleteDoc(
      doc(db, "users", uid, "workouts", dateKey, "sessions", workoutId),
    );
    console.log(`[API Response] deleteWorkoutDB success`);
  }, undefined);
}

// ── Saved Workouts (Templates) ─────────────────────────────
export async function saveWorkoutTemplateDB(
  uid: string,
  template: SavedWorkout,
): Promise<void> {
  console.log(`[API Request] saveWorkoutTemplateDB (uid: ${uid})`, template);
  await safe(async () => {
    const ref = doc(db, "users", uid, "workout_templates", template.id);
    await setDoc(ref, { ...template, savedAt: serverTimestamp() });
    console.log(`[API Response] saveWorkoutTemplateDB success`);
  }, undefined);
}

export async function getWorkoutTemplates(
  uid: string,
): Promise<SavedWorkout[]> {
  console.log(`[API Request] getWorkoutTemplates (uid: ${uid})`);
  return safe(async () => {
    const col = collection(db, "users", uid, "workout_templates");
    const snap = await getDocs(col);
    const templates = snap.docs.map((d) => d.data() as SavedWorkout);
    console.log(
      `[API Response] getWorkoutTemplates success, got ${templates.length} items`,
    );
    return templates;
  }, [] as SavedWorkout[]);
}

export async function deleteWorkoutTemplateDB(
  uid: string,
  templateId: string,
): Promise<void> {
  console.log(
    `[API Request] deleteWorkoutTemplateDB (uid: ${uid}, id: ${templateId})`,
  );
  await safe(async () => {
    await deleteDoc(doc(db, "users", uid, "workout_templates", templateId));
    console.log(`[API Response] deleteWorkoutTemplateDB success`);
  }, undefined);
}

// ── Recent meals (last 20 unique meal names) ──────────────
export async function saveRecentMeal(uid: string, meal: Meal): Promise<void> {
  console.log(`[API Request] saveRecentMeal (uid: ${uid})`, meal);
  await safe(async () => {
    const key = meal.name.toLowerCase().replace(/\s+/g, "_").slice(0, 40);
    const ref = doc(db, "users", uid, "recents", key);
    const recentMeal = {
      name: meal.name,
      cal: meal.cal,
      p: meal.p,
      c: meal.c,
      f: meal.f,
      time: meal.time,
      usedAt: serverTimestamp(),
    };
    await setDoc(ref, recentMeal);
    console.log(`[API Response] saveRecentMeal success`);
  }, undefined);
}

export async function getRecentMeals(uid: string): Promise<RecentMeal[]> {
  console.log(`[API Request] getRecentMeals (uid: ${uid})`);
  return safe(async () => {
    const col = collection(db, "users", uid, "recents");
    const q = query(col, orderBy("usedAt", "desc"));
    const snap = await getDocs(q);
    const recents = snap.docs.map((d) => d.data() as RecentMeal).slice(0, 20);
    console.log(
      `[API Response] getRecentMeals success, got ${recents.length} items`,
    );
    return recents;
  }, [] as RecentMeal[]);
}
