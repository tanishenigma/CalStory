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
import { getUserKey, setUserKey } from "@/app/lib/storage";
import type { Profile, Meal, Workout, SavedWorkout, RecentMeal } from "@/app/types";

/* ────────────────────────────────────────────────────────────
 * Offline-safe Firestore layer
 *
 * Every read tries Firestore first; if it throws (network down,
 * browser extension blocking the Listen channel, ad-blocker
 * stripping `firestore.googleapis.com`, etc.) it falls back to a
 * per-user localStorage cache that we keep updated on every write.
 *
 * Every write does the Firestore write AND a localStorage mirror
 * in parallel so the next page load (or extension-blocked load)
 * can recover the user's data.
 * ──────────────────────────────────────────────────────────── */

async function safe<T>(
  fn: () => Promise<T>,
  fallback: T | (() => T),
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Don't pollute the console for known extension-blocked cases
    // (Firestore Listen channel). Other errors still surface.
    if (err && typeof err === "object" && "code" in err) {

      console.warn(
        "[db] Firestore call failed, using local fallback:",
        (err as { code?: string }).code,
      );
    } else {

      console.warn("[db] Firestore call failed, using local fallback");
    }
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}

// ── Profile ──────────────────────────────────────────────
export async function saveProfile(
  uid: string,
  profile: Profile,
): Promise<void> {
  console.log(`[API Request] saveProfile (uid: ${uid})`, profile);
  // Always update the per-user local mirror first so the next load
  // (even if Firestore is blocked) sees the latest values.
  setUserKey(uid, "profile", profile);
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
  return safe(
    async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) {
        const local = getUserKey<Profile>(uid, "profile") ?? null;
        console.log(`[API Response] getProfile (not found in DB, local: ${!!local})`);
        return local;
      }
      const data = snap.data() as { profile: Profile };
      const profile = data.profile ?? null;
      if (profile) setUserKey(uid, "profile", profile);
      console.log(`[API Response] getProfile success`, profile);
      return profile;
    },
    () => {
      const fallback = getUserKey<Profile>(uid, "profile") ?? null;
      console.log(`[API Response] getProfile (fallback)`, fallback);
      return fallback;
    }
  );
}

// ── Meals ─────────────────────────────────────────────────
// Path: users/{uid}/meals/{dateKey}/items/{mealId}
export async function saveMeal(
  uid: string,
  dateKey: string,
  meal: Meal,
): Promise<void> {
  console.log(`[API Request] saveMeal (uid: ${uid}, date: ${dateKey})`, meal);
  // Mirror locally for offline / extension-blocked recovery
  const local = getUserKey<Record<string, Meal[]>>(uid, "meals") ?? {};
  const dayList = local[dateKey] ? [...local[dateKey], meal] : [meal];
  setUserKey(uid, "meals", { ...local, [dateKey]: dayList });

  await safe(async () => {
    const ref = doc(db, "users", uid, "meals", dateKey, "items", meal.id);
    await setDoc(ref, { ...meal, savedAt: serverTimestamp() });
    console.log(`[API Response] saveMeal success`);
  }, undefined);
}

export async function getMeals(uid: string, dateKey: string): Promise<Meal[]> {
  console.log(`[API Request] getMeals (uid: ${uid}, date: ${dateKey})`);
  return safe(
    async () => {
      const col = collection(db, "users", uid, "meals", dateKey, "items");
      const snap = await getDocs(col);
      const meals = snap.docs.map((d) => d.data() as Meal);
      // Update the local cache
      const local = getUserKey<Record<string, Meal[]>>(uid, "meals") ?? {};
      setUserKey(uid, "meals", { ...local, [dateKey]: meals });
      console.log(`[API Response] getMeals success, got ${meals.length} items`);
      return meals;
    },
    () => {
      const local = getUserKey<Record<string, Meal[]>>(uid, "meals") ?? {};
      const fallback = local[dateKey] ?? [];
      console.log(`[API Response] getMeals (fallback), got ${fallback.length} items`);
      return fallback;
    },
  );
}

export async function deleteMealDB(
  uid: string,
  dateKey: string,
  mealId: string,
): Promise<void> {
  console.log(`[API Request] deleteMealDB (uid: ${uid}, date: ${dateKey}, id: ${mealId})`);
  // Mirror deletion locally
  const local = getUserKey<Record<string, Meal[]>>(uid, "meals") ?? {};
  const next = (local[dateKey] || []).filter((m) => m.id !== mealId);
  setUserKey(uid, "meals", { ...local, [dateKey]: next });

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
  console.log(`[API Request] saveWorkout (uid: ${uid}, date: ${dateKey})`, workout);
  const local = getUserKey<Record<string, Workout[]>>(uid, "workouts") ?? {};
  const dayList = local[dateKey] ? [...local[dateKey], workout] : [workout];
  setUserKey(uid, "workouts", { ...local, [dateKey]: dayList });

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
  return safe(
    async () => {
      const col = collection(db, "users", uid, "workouts", dateKey, "sessions");
      const snap = await getDocs(col);
      const workouts = snap.docs.map((d) => d.data() as Workout);
      const local =
        getUserKey<Record<string, Workout[]>>(uid, "workouts") ?? {};
      setUserKey(uid, "workouts", { ...local, [dateKey]: workouts });
      console.log(`[API Response] getWorkouts success, got ${workouts.length} items`);
      return workouts;
    },
    () => {
      const local =
        getUserKey<Record<string, Workout[]>>(uid, "workouts") ?? {};
      const fallback = local[dateKey] ?? [];
      console.log(`[API Response] getWorkouts (fallback), got ${fallback.length} items`);
      return fallback;
    },
  );
}

export async function deleteWorkoutDB(
  uid: string,
  dateKey: string,
  workoutId: string,
): Promise<void> {
  console.log(`[API Request] deleteWorkoutDB (uid: ${uid}, date: ${dateKey}, id: ${workoutId})`);
  const local = getUserKey<Record<string, Workout[]>>(uid, "workouts") ?? {};
  const next = (local[dateKey] || []).filter((w) => w.id !== workoutId);
  setUserKey(uid, "workouts", { ...local, [dateKey]: next });

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
  const local = getUserKey<SavedWorkout[]>(uid, "workoutTemplates") ?? [];
  const filtered = local.filter((t) => t.id !== template.id);
  setUserKey(uid, "workoutTemplates", [...filtered, template]);

  await safe(async () => {
    const ref = doc(db, "users", uid, "workout_templates", template.id);
    await setDoc(ref, { ...template, savedAt: serverTimestamp() });
    console.log(`[API Response] saveWorkoutTemplateDB success`);
  }, undefined);
}

export async function getWorkoutTemplates(uid: string): Promise<SavedWorkout[]> {
  console.log(`[API Request] getWorkoutTemplates (uid: ${uid})`);
  return safe(
    async () => {
      const col = collection(db, "users", uid, "workout_templates");
      // Could order by savedAt here if needed, but not critical
      const snap = await getDocs(col);
      const templates = snap.docs.map((d) => d.data() as SavedWorkout);
      setUserKey(uid, "workoutTemplates", templates);
      console.log(`[API Response] getWorkoutTemplates success, got ${templates.length} items`);
      return templates;
    },
    () => {
      const fallback = getUserKey<SavedWorkout[]>(uid, "workoutTemplates") ?? [];
      console.log(`[API Response] getWorkoutTemplates (fallback), got ${fallback.length} items`);
      return fallback;
    },
  );
}

export async function deleteWorkoutTemplateDB(
  uid: string,
  templateId: string,
): Promise<void> {
  console.log(`[API Request] deleteWorkoutTemplateDB (uid: ${uid}, id: ${templateId})`);
  const local = getUserKey<SavedWorkout[]>(uid, "workoutTemplates") ?? [];
  const next = local.filter((t) => t.id !== templateId);
  setUserKey(uid, "workoutTemplates", next);

  await safe(async () => {
    await deleteDoc(doc(db, "users", uid, "workout_templates", templateId));
    console.log(`[API Response] deleteWorkoutTemplateDB success`);
  }, undefined);
}

// ── Recent meals (last 20 unique meal names) ──────────────
export async function saveRecentMeal(uid: string, meal: Meal): Promise<void> {
  console.log(`[API Request] saveRecentMeal (uid: ${uid})`, meal);
  // Mirror locally
  const local = getUserKey<RecentMeal[]>(uid, "recents") ?? [];
  const filtered = local.filter(
    (r) => r.name.toLowerCase() !== meal.name.toLowerCase(),
  );
  setUserKey(
    uid,
    "recents",
    [
      {
        name: meal.name,
        cal: meal.cal,
        p: meal.p,
        c: meal.c,
        f: meal.f,
        time: meal.time,
      },
      ...filtered,
    ].slice(0, 20),
  );

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
  return safe(
    async () => {
      const col = collection(db, "users", uid, "recents");
      const q = query(col, orderBy("usedAt", "desc"));
      const snap = await getDocs(q);
      const recents = snap.docs.map((d) => d.data() as RecentMeal).slice(0, 20);
      setUserKey(uid, "recents", recents);
      console.log(`[API Response] getRecentMeals success, got ${recents.length} items`);
      return recents;
    },
    () => {
      const fallback = getUserKey<RecentMeal[]>(uid, "recents") ?? [];
      console.log(`[API Response] getRecentMeals (fallback), got ${fallback.length} items`);
      return fallback;
    }
  );
}
