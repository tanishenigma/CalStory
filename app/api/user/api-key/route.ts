/**
 * /api/user/api-key — Protected route handler for managing personal Gemini API keys.
 *
 * Endpoints:
 *   GET    /api/user/api-key  → { hasKey: boolean, preview: string | null }
 *   POST   /api/user/api-key  → { success: true, preview: string }
 *   DELETE /api/user/api-key  → { success: true }
 *
 * Security guarantees:
 *   1. Every request requires a valid Firebase ID token in the
 *      Authorization: Bearer <token> header. The token is verified
 *      server-side against Firebase Auth.
 *   2. The userId is extracted exclusively from the verified token —
 *      any client-supplied userId in the body is IGNORED.
 *   3. All Firestore reads/writes use the Firestore REST API authenticated
 *      with the user's own ID token, so security rules are enforced by
 *      Firestore itself (no Admin SDK required).
 *   4. The key is validated with a strict regex before being stored.
 *   5. The full key is NEVER returned — only { hasKey, preview }.
 *   6. The key value is never written to any log.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  validateKeyFormat,
  maskKey,
  saveApiKeyToFirestore,
  deleteApiKeyFromFirestore,
} from "@/app/lib/gemini-key";
import { isEncrypted } from "@/app/lib/server-crypto";

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ── Firebase token verification ────────────────────────────────────
async function verifyFirebaseToken(
  idToken: string,
): Promise<{ uid: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("[api-key route] NEXT_PUBLIC_FIREBASE_API_KEY is not set");
    return null;
  }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: { localId: string }[];
    };
    const uid = data.users?.[0]?.localId;
    if (!uid) return null;
    return { uid };
  } catch {
    return null;
  }
}

async function authenticate(
  req: NextRequest,
): Promise<{ uid: string; idToken: string } | NextResponse> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.slice(7);
  const verified = await verifyFirebaseToken(idToken);
  if (!verified) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }
  return { uid: verified.uid, idToken };
}

// ── Read raw value from Firestore REST (for status check only) ─────
async function readRawStoredValue(
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
    return doc.fields?.geminiApiKey?.stringValue ?? null;
  } catch {
    return null;
  }
}

// ── GET — check whether user has a stored key ──────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const result = await authenticate(req);
  if (result instanceof NextResponse) return result;
  const { uid, idToken } = result;

  const raw = await readRawStoredValue(uid, idToken);
  if (!raw) {
    return NextResponse.json({
      hasKey: false,
      preview: null,
      needsReEncrypt: false,
    });
  }

  // Detect pre-encryption plaintext keys ("AIza...") vs encrypted ("enc:...")
  const encrypted = isEncrypted(raw);

  // For encrypted keys: show a constant placeholder — the real plaintext
  // key is never available here without decrypting, which is unnecessary.
  // For unencrypted (migration path): same placeholder.
  const preview = "AIza••••••••••••••••••••••••••••••••••";

  return NextResponse.json({
    hasKey: true,
    preview,
    needsReEncrypt: !encrypted,
  });
}

// ── POST — save a new key ──────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const result = await authenticate(req);
  if (result instanceof NextResponse) return result;
  const { uid, idToken } = result;

  let body: { apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawKey = (body.apiKey ?? "").trim();

  // Server-side format validation — the authoritative check
  if (!validateKeyFormat(rawKey)) {
    return NextResponse.json(
      {
        error:
          "Invalid API key format. Gemini keys start with AIza and are 39 characters long.",
      },
      { status: 422 },
    );
  }

  const ok = await saveApiKeyToFirestore(uid, idToken, rawKey);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to save key. Please try again." },
      { status: 500 },
    );
  }

  // Return only success + masked preview — NEVER echo back the key
  return NextResponse.json({ success: true, preview: maskKey(rawKey) });
}

// ── DELETE — remove the stored key ────────────────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const result = await authenticate(req);
  if (result instanceof NextResponse) return result;
  const { uid, idToken } = result;

  const ok = await deleteApiKeyFromFirestore(uid, idToken);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to remove key from database. Please try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
