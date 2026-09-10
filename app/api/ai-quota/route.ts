import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { getPromptUsage } from "@/app/lib/ai-quota";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  try {
    return NextResponse.json(
      await getPromptUsage(auth.uid, auth.idToken),
    );
  } catch (error) {
    console.error("[ai-quota] Failed to read prompt usage:", error);
    return NextResponse.json(
      { error: "Prompt usage is temporarily unavailable." },
      { status: 503 },
    );
  }
}
