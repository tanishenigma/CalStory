import type {
  FitnessLog,
  HydrationLog,
  Meal,
  Profile,
  RecentMeal,
  SavedWorkout,
  WeightLog,
  Workout,
} from "@/app/types";

type FirestoreValue = {
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  stringValue?: string;
  bytesValue?: string;
  referenceValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

type ListResponse = {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
};

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.bytesValue !== undefined) return value.bytesValue;
  if (value.referenceValue !== undefined) return value.referenceValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decodeValue);
  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [
        key,
        decodeValue(item),
      ]),
    );
  }
  return null;
}

function decodeDocument<T>(document: FirestoreDocument): T {
  return Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [
      key,
      decodeValue(value),
    ]),
  ) as T;
}

function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

async function readDocument(
  path: string,
  idToken: string,
): Promise<FirestoreDocument | null> {
  const response = await fetch(`${FIRESTORE_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore document read failed (${response.status})`);
  return (await response.json()) as FirestoreDocument;
}

async function listCollection(
  path: string,
  idToken: string,
): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken = "";

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({ pageSize: "1000" });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`${FIRESTORE_BASE}/${path}?${params}`, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Firestore collection read failed (${response.status})`);
    const data = (await response.json()) as ListResponse;
    documents.push(...(data.documents ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return documents;
}

function documentId(document: FirestoreDocument): string {
  return document.name?.split("/").pop() ?? "unknown";
}

async function readDatedCollection<T>(
  uid: string,
  collectionName: string,
  idToken: string,
): Promise<Record<string, T[]>> {
  const days = await listCollection(
    `users/${pathSegment(uid)}/${collectionName}`,
    idToken,
  );
  const entries = await Promise.all(
    days.map(async (dayDocument) => {
      const date = documentId(dayDocument);
      const items = await listCollection(
        `users/${pathSegment(uid)}/${collectionName}/${pathSegment(date)}/${collectionName === "meals" ? "items" : "sessions"}`,
        idToken,
      );
      return [date, items.map((item) => decodeDocument<T>(item))] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function safeRead<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.warn("[ai-user-context] Firestore context read failed:", error);
    return fallback;
  }
}

export interface AIUserContext {
  profile: Profile | null;
  meals: Record<string, Meal[]>;
  workouts: Record<string, Workout[]>;
  workoutTemplates: SavedWorkout[];
  recentMeals: RecentMeal[];
  weightLogs: WeightLog[];
  fitnessLogs: FitnessLog[];
  hydrationLogs: HydrationLog[];
}

export async function getAIUserContext(
  uid: string,
  idToken: string,
): Promise<AIUserContext> {
  const userPath = `users/${pathSegment(uid)}`;
  const profileDocument = await safeRead(
    () => readDocument(userPath, idToken),
    null,
  );

  const [meals, workouts, templates, recents, weightLogs, fitnessLogs, hydrationLogs] =
    await Promise.all([
      safeRead(() => readDatedCollection<Meal>(uid, "meals", idToken), {}),
      safeRead(() => readDatedCollection<Workout>(uid, "workouts", idToken), {}),
      safeRead(
        () =>
          listCollection(`${userPath}/workout_templates`, idToken).then((docs) =>
            docs.map((doc) => decodeDocument<SavedWorkout>(doc)),
          ),
        [],
      ),
      safeRead(
        () =>
          listCollection(`${userPath}/recents`, idToken).then((docs) =>
            docs.map((doc) => decodeDocument<RecentMeal>(doc)),
          ),
        [],
      ),
      safeRead(
        () =>
          listCollection(`${userPath}/weight_logs`, idToken).then((docs) =>
            docs.map((doc) => decodeDocument<WeightLog>(doc)),
          ),
        [],
      ),
      safeRead(
        () =>
          listCollection(`${userPath}/fitness_logs`, idToken).then((docs) =>
            docs.map((doc) => decodeDocument<FitnessLog>(doc)),
          ),
        [],
      ),
      safeRead(
        () =>
          listCollection(`${userPath}/hydration`, idToken).then((docs) =>
            docs.map((doc) => decodeDocument<HydrationLog>(doc)),
          ),
        [],
      ),
    ]);

  const profile = profileDocument
    ? (decodeDocument<{ profile?: Profile }>(profileDocument).profile ?? null)
    : null;

  return {
    profile,
    meals,
    workouts,
    workoutTemplates: templates,
    recentMeals: recents,
    weightLogs,
    fitnessLogs,
    hydrationLogs,
  };
}
