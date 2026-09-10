import type { SubscriptionTier } from "@/app/types";
import { FREE_DAILY_PROMPT_LIMIT } from "@/app/lib/plan-limits";

export interface PromptUsage {
  used: number;
  limit: number | null;
  tier: SubscriptionTier;
  day: string;
}

interface FirestoreDocument {
  name?: string;
  updateTime?: string;
  fields?: Record<string, { stringValue?: string; integerValue?: string }>;
}

const FIRESTORE_DOCUMENTS = `projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/${FIRESTORE_DOCUMENTS}`;

function documentPath(uid: string, day: string): string {
  return `users/${uid}/prompt_usage/${day}`;
}

function documentResourceName(path: string): string {
  return `${FIRESTORE_DOCUMENTS}/${path}`;
}

function readInteger(
  fields: FirestoreDocument["fields"],
  key: string,
): number {
  const value = fields?.[key]?.integerValue;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function readString(
  fields: FirestoreDocument["fields"],
  key: string,
): string | null {
  return fields?.[key]?.stringValue ?? null;
}

function tierFromDocument(document: FirestoreDocument | null): SubscriptionTier {
  const tier = readString(document?.fields, "tier");
  return tier === "plus" || tier === "pro" ? tier : "free";
}

async function readDocument(
  path: string,
  idToken: string,
): Promise<FirestoreDocument | null> {
  const response = await fetch(`${FIRESTORE_URL}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore read failed (${response.status})`);
  return (await response.json()) as FirestoreDocument;
}

async function readTier(uid: string, idToken: string): Promise<SubscriptionTier> {
  return tierFromDocument(
    await readDocument(`users/${uid}/subscription/active`, idToken),
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function commitPromptCount(
  path: string,
  day: string,
  count: number,
  previous: FirestoreDocument | null,
  idToken: string,
): Promise<boolean> {
  const write: Record<string, unknown> = {
    update: {
      name: documentResourceName(path),
      fields: {
        day: { stringValue: day },
        count: { integerValue: String(count) },
      },
    },
  };

  if (previous?.updateTime) {
    write.currentDocument = { updateTime: previous.updateTime };
  } else {
    write.currentDocument = { exists: false };
  }

  const response = await fetch(`${FIRESTORE_URL}:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes: [write] }),
  });

  if (response.ok) return true;

  const errorBody = await response.text().catch(() => "");
  let firestoreError: { status?: string; message?: string } = {};
  try {
    const parsed = JSON.parse(errorBody) as {
      error?: { status?: string; message?: string };
    };
    firestoreError = parsed.error ?? {};
  } catch {
    // Keep the HTTP status as the useful diagnostic when the body is not JSON.
  }

  // Firestore may return FAILED_PRECONDITION as HTTP 400 when a concurrent
  // write invalidates the updateTime precondition. Only that specific 400 is
  // retryable; INVALID_ARGUMENT and permission errors must surface immediately.
  if (
    response.status === 409 ||
    response.status === 412 ||
    firestoreError.status === "FAILED_PRECONDITION"
  ) {
    return false;
  }

  const detail = firestoreError.message ? `: ${firestoreError.message}` : "";
  throw new Error(`Firestore commit failed (${response.status})${detail}`);
}

function retryDelay(attempt: number): Promise<void> {
  const delayMs = Math.min(1000, 50 * 2 ** attempt + Math.random() * 50);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function getPromptUsage(
  uid: string,
  idToken: string,
): Promise<PromptUsage> {
  const day = todayUtc();
  const [tier, usage] = await Promise.all([
    readTier(uid, idToken),
    readDocument(documentPath(uid, day), idToken),
  ]);
  return {
    used: readInteger(usage?.fields, "count"),
    limit: tier === "free" ? FREE_DAILY_PROMPT_LIMIT : null,
    tier,
    day,
  };
}

export async function consumePrompt(
  uid: string,
  idToken: string,
): Promise<PromptUsage & { allowed: boolean }> {
  const day = todayUtc();
  const path = documentPath(uid, day);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const [tier, previous] = await Promise.all([
      readTier(uid, idToken),
      readDocument(path, idToken),
    ]);
    const used = readInteger(previous?.fields, "count");
    const limit = tier === "free" ? FREE_DAILY_PROMPT_LIMIT : null;

    if (limit !== null && used >= limit) {
      return { allowed: false, used, limit, tier, day };
    }

    const nextCount = used + 1;
    const committed = await commitPromptCount(
      path,
      day,
      nextCount,
      previous,
      idToken,
    );
    if (committed) {
      return { allowed: true, used: nextCount, limit, tier, day };
    }

    await retryDelay(attempt);
  }

  throw new Error("Prompt usage changed too often; please retry.");
}
