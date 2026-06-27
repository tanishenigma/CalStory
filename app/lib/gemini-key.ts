/**
 * gemini-key.ts — SERVER ONLY
 *
 * Resolves which Gemini API key to use for a given user request.
 * All Firestore reads/writes go through the REST API authenticated
 * with the user's Firebase ID token (no Admin SDK required).
 *
 * Keys stored in Firestore are AES-256-GCM encrypted via server-crypto.ts.
 * The encryption secret lives only in GEMINI_KEY_ENCRYPTION_SECRET (env).
 */

import {
  encryptApiKey,
  decryptApiKey,
  isEncrypted,
} from "@/app/lib/server-crypto";
import { logger } from "@/app/lib/logger";

export const GEMINI_KEY_REGEX = /^AIza[0-9A-Za-z\-_]{35}$/;

export function validateKeyFormat(key: string): boolean {
  return GEMINI_KEY_REGEX.test(key.trim());
}

export function maskKey(key: string): string {
  if (key.length < 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
}

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function fetchApiKeyFromFirestore(
  uid: string,
  idToken: string,
): Promise<string | null> {
  const url = `${FIRESTORE_BASE}/users/${uid}/settings/api_keys`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return null;
    const doc = (await res.json()) as {
      fields?: { geminiApiKey?: { stringValue?: string } };
    };
    const stored = doc.fields?.geminiApiKey?.stringValue;
    if (!stored) return null;

    if (!isEncrypted(stored)) {
      console.warn(
        `[gemini-key] User ${uid} has a plaintext key — prompting re-save.`,
      );
      return null;
    }

    return decryptApiKey(stored);
  } catch (err) {
    console.warn("[gemini-key] Failed to read/decrypt personal key:", err);
    return null;
  }
}

export async function saveApiKeyToFirestore(
  uid: string,
  idToken: string,
  plaintextKey: string,
): Promise<boolean> {
  const url = `${FIRESTORE_BASE}/users/${uid}/settings/api_keys?updateMask.fieldPaths=geminiApiKey`;
  try {
    const encrypted = encryptApiKey(plaintextKey);
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          geminiApiKey: { stringValue: encrypted },
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[gemini-key] Failed to save encrypted key:", err);
    return false;
  }
}

export async function deleteApiKeyFromFirestore(
  uid: string,
  idToken: string,
): Promise<boolean> {
  // Same URL pattern as save — updateMask scopes the write to only geminiApiKey
  const url = `${FIRESTORE_BASE}/users/${uid}/settings/api_keys?updateMask.fieldPaths=geminiApiKey`;
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      // Empty fields object — geminiApiKey is in the mask but not in fields,
      // so Firestore removes it from the document.
      body: JSON.stringify({ fields: {} }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "(unreadable)");
      console.error(
        `[gemini-key] deleteApiKeyFromFirestore failed (${res.status}):`,
        errBody,
      );
    }
    return res.ok;
  } catch (err) {
    console.error("[gemini-key] deleteApiKeyFromFirestore network error:", err);
    return false;
  }
}

/**
 * Resolve the best available Gemini API key for `userId`.
 *
 * Resolution order:
 *   1. Personal key stored (encrypted) in Firestore — requires idToken
 *   2. GEMINI_API_KEY environment variable (shared / deployment key)
 *
 * Returns null when no key is available.
 *
 * @param userId  Firebase UID from the request body
 * @param idToken Firebase ID token from Authorization header (optional)
 */
export async function resolveGeminiKey(
  userId: string,
  idToken?: string,
): Promise<string | null> {
  // 1. Try personal encrypted key from Firestore
  if (idToken) {
    try {
      const personalKey = await fetchApiKeyFromFirestore(userId, idToken);
      if (personalKey && validateKeyFormat(personalKey)) {
        logger.debug(`[gemini-key] Using personal key for user ${userId}`);
        return personalKey;
      }
    } catch (err) {
      console.warn("[gemini-key] Personal key lookup failed:", err);
    }
  }

  // 2. Fall back to shared env key
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && validateKeyFormat(envKey)) {
    return envKey;
  }

  return null;
}
