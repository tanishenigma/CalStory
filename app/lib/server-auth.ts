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

function assertAllowedOrigin(url: string): void {
  const parsed = new URL(url);
  if (!ALLOWED_ORIGINS.has(parsed.origin)) {
    throw new Error(`[server-auth] Blocked fetch to disallowed origin: ${parsed.origin}`);
  }
}

export async function verifyFirebaseToken(
  idToken: string,
): Promise<{ uid: string } | null> {
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
    return uid ? { uid } : null;
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

