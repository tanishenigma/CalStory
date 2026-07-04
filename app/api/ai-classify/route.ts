import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ------------------------------------------------------------------
 * /api/ai-classify
 *
 * Tiny single-turn endpoint used by the global FAB chat to route a
 * free-form user message to either the food or workout pipeline
 * before sending it to the heavier per-domain endpoints.
 *
 * The classifier is intentionally minimal:
 *   - One system prompt with three allowed intents.
 *   - Low temperature so it stays decisive.
 *   - No tools / no Google Search — we only need a label, not facts.
 *
 * If the user's message clearly mentions BOTH food and a workout in
 * the same turn (e.g. "after chicken rice I did 5km"), we default to
 * "food" and surface a small notice in the UI to follow up with the
 * workout. Multi-intent single messages are rare in practice; if
 * usage shows otherwise we can extend the prompt with ordering hints.
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are a routing classifier for CalStory, a fitness tracking app.
The user will type a short free-form message. Decide which logging flow it belongs to.

Return ONLY valid JSON in this exact shape — no markdown, no commentary:
{
  "intent": "food" | "workout",
  "confidence": number,        // 0..1, how sure you are
  "reason": string             // ≤ 12 words, used for debugging only
}

Rules:
- "food" when the message describes a meal, snack, drink, calories, macros, ingredients, or quantities of something eaten (e.g. "2 eggs and toast", "protein shake", "big bowl of pasta").
- "workout" when the message describes exercises, sets/reps/weight, cardio, running, yoga, sports, training, or any physical activity (e.g. "bench 80kg 3x10", "ran 5km", "did yoga").
- When in doubt, return "food". Food is the more common entry and the UI lets the user correct it.
- Never return anything outside the JSON object.`;

type ClassifyResponse = {
  intent: "food" | "workout";
  confidence: number;
  reason: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Pass through the caller's auth so we can use a personal Gemini key
  // (same pattern as the food/workout endpoints). The classifier
  // doesn't read user data — it only needs an API key to call Gemini.
  // FAB opens before any user is signed in for the chat, so we treat
  // the auth-optional case by reading only the env key when no
  // Authorization header is present (resolveGeminiKey requires a
  // userId for its Firestore lookup, so we skip that branch entirely
  // for anonymous callers).
  const authHeader = req.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  let apiKey: string | null = null;
  if (idToken) {
    // Authenticated callers — try their personal key, then env fallback.
    // resolveGeminiKey needs a userId, but we don't have one in this
    // route. Anonymous FAB chat users hit the env-only branch below.
    apiKey = process.env.GEMINI_API_KEY ?? null;
  } else {
    apiKey = process.env.GEMINI_API_KEY ?? null;
  }

  if (!apiKey) {
    // Without an API key we still need a sensible default. Food is the
    // safer bet — it has the higher per-session volume — and the user
    // can immediately type "actually I meant a workout" if wrong.
    return NextResponse.json({
      intent: "food",
      confidence: 0,
      reason: "no Gemini key — defaulting to food",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      // Low temperature → more deterministic routing.
      generationConfig: { temperature: 0.1 },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
    });
    const raw = result.response.text().trim();
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as ClassifyResponse;
      // Defensive: clamp confidence, force intent to the enum.
      const intent: "food" | "workout" =
        parsed.intent === "workout" ? "workout" : "food";
      const confidence = Math.max(
        0,
        Math.min(1, Number(parsed.confidence) || 0),
      );
      return NextResponse.json({
        intent,
        confidence,
        reason: String(parsed.reason ?? "").slice(0, 80),
      });
    } catch {
      console.error("[ai-classify] JSON parse failed. Raw:", raw);
      return NextResponse.json({
        intent: "food",
        confidence: 0,
        reason: "classifier returned unparseable JSON — defaulted to food",
      });
    }
  } catch (err) {
    console.error("[ai-classify] Gemini SDK error:", err);
    return NextResponse.json({
      intent: "food",
      confidence: 0,
      reason: "classifier call failed — defaulted to food",
    });
  }
}
