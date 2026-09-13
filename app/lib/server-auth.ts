import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export interface AuthenticatedRequest {
  uid: string;
  idToken: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://identitytoolkit.googleapis.com",
  "https://firestore.googleapis.com",
]);

// Firebase token verification is a remote request. The same ID token is
// commonly used for several API calls during one interaction (quota, intent,
// and the final AI request), so avoid paying that network round-trip every
// time. This is intentionally short-lived; revocation is still picked up on
// the next cache miss.
const verificationCache = new Map<string, { uid: string; expiresAt: number }>();
const TOKEN_CACHE_TTL_MS = 60_000;

function assertAllowedOrigin(url: string): void {
  const parsed = new URL(url);
  if (!ALLOWED_ORIGINS.has(parsed.origin)) {
    throw new Error(`[server-auth] Blocked fetch to disallowed origin: ${parsed.origin}`);
  }
}

export async function verifyFirebaseToken(
  idToken: string,
): Promise<{ uid: string } | null> {
  const cached = verificationCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) return { uid: cached.uid };
  if (cached) verificationCache.delete(idToken);

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("[server-auth] NEXT_PUBLIC_FIREBASE_API_KEY is not set");
    return null;
  }

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    assertAllowedOrigin(url);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      users?: Array<{ localId: string }>;
    };
    const uid = data.users?.[0]?.localId;
    if (!uid) return null;
    verificationCache.set(idToken, {
      uid,
      expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
    });
    return { uid };
  } catch {
    return null;
  }
}

export async function authenticateFirebaseRequest(
  req: NextRequest,
): Promise<AuthenticatedRequest | NextResponse> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.slice(7).trim();
  const verified = idToken ? await verifyFirebaseToken(idToken) : null;
  if (!verified) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  }

  return { uid: verified.uid, idToken };
}

export function isNextResponse(
  value: AuthenticatedRequest | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
