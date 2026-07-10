import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  sanitizeMessage,
  sanitizeHistory,
} from "@/app/lib/sanitize-input";

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
 *
 * The caller may pass `conversationHistory` so the classifier can
 * resolve short follow-ups like "please also log 50 pushups" — read
 * alone those are ambiguous ("also log" implies an addendum to a
 * prior turn), and without context the model would default to
 * "food" per the in-doubt rule, sending workouts to the wrong
 * pipeline. Forwarding the last few turns lets the model see the
 * prior intent and route the follow-up correctly.
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are a routing classifier for CalStory, a fitness tracking app.
The user is having a multi-turn chat with the assistant and just sent a new message. Decide which logging flow(s) it belongs to. The user can mention BOTH food and a workout in the same turn — in that case return BOTH intents so the app can run both pipelines.

You may also receive the recent chat history (up to the last few turns). Use it to disambiguate short follow-ups — phrases like "also log X", "and I did Y too", "log that as a workout instead", or any reply that only makes sense in context of a previous turn. The greeting / welcome message from the model is NOT a real user request — treat it as neutral context, not as evidence that the user wants to log food.

Return ONLY valid JSON in this exact shape — no markdown, no commentary:
{
  "intents": ("food" | "workout")[],  // 1 or 2 entries; both if mixed
  "confidence": number,                 // 0..1, how sure you are
  "reason": string                      // ≤ 12 words, used for debugging only
}

Rules:
- Classify ONLY the latest user message, not the whole conversation.
- Return BOTH "food" and "workout" if the message contains a clear food mention AND a clear workout mention (e.g. "I ate 100g chicken and did 10 pushups", "after my rice I ran 5km", "I also did 10 pushups and ate 100g soya chunks").
- Return ONLY "food" if the message mentions only food / meals / drinks (e.g. "2 eggs and toast", "protein shake", "200g chicken and rice").
- Return ONLY "workout" if the message mentions only exercises / training (e.g. "Pull-ups 3x12", "Bench 80kg 3x10", "Ran 5km in 25 minutes", "Did yoga for 30 min", "50 pushups", "Pull-ups", "Pushups").
- "workout" examples that are ALWAYS workout (set/rep notation, exercise verbs, exercise names).
- When a message contains set/rep notation like "3x12", "5x5", "3x10 @ 80kg", it is ALWAYS a workout — exercise notation is unambiguous.
- If the message is genuinely ambiguous AND there's no useful history (just a greeting), prefer ["workout"] — the food pipeline can clarify ("what did you eat?"), and a food message routed to workout is a much worse user experience than the reverse.
- Never return anything outside the JSON object. Never return an empty array.`;

type ClassifyResponse = {
  intents: Array<"food" | "workout">;
  confidence: number;
  reason: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: {
    message: string;
    conversationHistory?: Array<{ role: "user" | "model"; content: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message: rawMessage, conversationHistory } = body;
  const message = sanitizeMessage(rawMessage ?? "");
  if (!message) {
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
    // Without an API key we still need a sensible default. We bias
    // toward "workout" because the food pipeline has a friendly
    // fallback ("what did you eat?") when it receives a non-food
    // message, but the workout pipeline rejects non-workout inputs
    // outright. A false-workout is much easier to recover from than
    // a false-food.
    return NextResponse.json({
      intent: "workout",
      confidence: 0,
      reason: "no Gemini key — defaulting to workout",
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

    // Build a multi-turn contents array so the classifier can see the
    // last few user/model turns before deciding. We cap to the last 6
    // turns (3 exchanges) to keep the token cost trivial — older
    // context almost never changes the routing decision.
    const safeHistory = sanitizeHistory(conversationHistory);
    const recentHistory = safeHistory
      .slice(-6);

    const contents: Array<{
      role: "user" | "model";
      parts: { text: string }[];
    }> = [
      ...recentHistory.map((m) => ({
        role: m.role as "user" | "model",
        parts: [{ text: m.content }],
      })),
      // The new turn is always last so the model sees it in the
      // correct chronological slot.
      { role: "user", parts: [{ text: message }] },
    ];

    const result = await model.generateContent({ contents });
    const raw = result.response.text().trim();
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as ClassifyResponse;
      // Defensive: clamp confidence, force every entry in `intents`
      // to the enum, dedupe, and never return an empty array.
      const raw = Array.isArray(parsed.intents) ? parsed.intents : [];
      const intents: Array<"food" | "workout"> = Array.from(
        new Set(
          raw
            .map((i) => (i === "workout" ? "workout" : "food"))
            .filter(
              (i): i is "food" | "workout" => i === "food" || i === "workout",
            ),
        ),
      );
      const finalIntents =
        intents.length > 0
          ? intents
          : (["workout"] as Array<"food" | "workout">);
      const confidence = Math.max(
        0,
        Math.min(1, Number(parsed.confidence) || 0),
      );
      return NextResponse.json({
        intents: finalIntents,
        confidence,
        reason: String(parsed.reason ?? "").slice(0, 80),
      });
    } catch {
      console.error("[ai-classify] JSON parse failed. Raw:", raw);
      return NextResponse.json({
        intents: ["workout"],
        confidence: 0,
        reason: "classifier returned unparseable JSON — defaulted to workout",
      });
    }
  } catch (err) {
    console.error("[ai-classify] Gemini SDK error:", err);
    return NextResponse.json({
      intents: ["workout"],
      confidence: 0,
      reason: "classifier call failed — defaulted to workout",
    });
  }
}
