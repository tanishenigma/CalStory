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

/**
 * Gemini API keys always start with "AIza" followed by exactly 35
 * characters from [0-9A-Za-z\-_]. Total length = 39 characters.
 */
export const GEMINI_KEY_REGEX = /^AIza[0-9A-Za-z\-_]{35}$/;

/** Validate that a string looks like a real Gemini API key. */
export function validateKeyFormat(key: string): boolean {
  return GEMINI_KEY_REGEX.test(key.trim());
}

/** Build the masked preview shown in the UI (first 4 + last 4 chars). */
export function maskKey(key: string): string {
  if (key.length < 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`;
}

// ── Firestore REST helpers ──────────────────────────────────────────
// We use the Firestore REST API authenticated with the user's Firebase
// ID token. This satisfies the existing security rules:
//   request.auth.uid == uid
// without needing the Firebase Admin SDK or a service account.

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Read users/{uid}/settings/api_keys, decrypt the stored key, and return
 * the plaintext Gemini API key.
 *
 * Migration path: if the stored value is not yet encrypted (plaintext key
 * saved before encryption was deployed), we return null and let the caller
 * surface a "please re-save your key" message instead of silently using an
 * unencrypted value — this forces a clean encrypted re-save.
 */
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

    // If the value is a plaintext key (saved before encryption was added),
    // treat as "not found" so the user is prompted to re-save. This is
    // safer than silently using the unencrypted value.
    if (!isEncrypted(stored)) {
      console.warn(
        `[gemini-key] User ${uid} has a plaintext key — prompting re-save.`,
      );
      return null;
    }

    // Decrypt — throws if the key material is wrong or data was tampered with
    return decryptApiKey(stored);
  } catch (err) {
    console.warn("[gemini-key] Failed to read/decrypt personal key:", err);
    return null;
  }
}

/**
 * Encrypt the API key and write it to Firestore via REST.
 * The plaintext key is NEVER written to Firestore.
 */
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

/**
 * Delete the geminiApiKey field from Firestore via REST.
 *
 * Firestore field-deletion via PATCH + updateMask:
 *   When a field is listed in updateMask but NOT present in the `fields`
 *   body, Firestore deletes that field from the document. This is the
 *   official field-deletion pattern for the REST API.
 */
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
