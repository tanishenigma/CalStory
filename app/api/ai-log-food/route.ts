import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIResponse, ChatMessage } from "@/app/types";
import { resolveGeminiKey } from "@/app/lib/gemini-key";

/* ------------------------------------------------------------------
 * System prompt — instructs Gemini to always return strict JSON.
 * NOTE: googleSearch grounding is incompatible with responseMimeType:
 * "application/json" in the Gemini API. We enforce JSON via the prompt
 * instead and parse the response manually with a fallback.
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are a nutrition assistant for CalStory, a fitness tracking app.
The user will describe what they ate in natural language.
Your job is to identify the food and estimate its macronutrients accurately.
Use your web search results to find accurate data for branded products, restaurant items, or regional dishes.

CRITICAL: Always respond with ONLY valid JSON — no markdown, no code fences, no extra text.
The JSON must exactly match this TypeScript type:
{
  "type": "confirmation" | "clarification" | "error",
  "message": string,       // 1-2 friendly sentences summarising the estimate
  "meal": {                // null when type is "clarification" or "error"
    "name": string,        // concise food name
    "cal": number,         // total kcal (integer)
    "p": number,           // protein in grams (integer)
    "c": number,           // carbohydrates in grams (integer)
    "f": number,           // fat in grams (integer)
    "time": "breakfast" | "lunch" | "dinner" | "snack",
    "aiComment": string    // brief note about data source / confidence
  } | null,
  "suggestions": string[]  // 2-3 quick-add chip labels for follow-up meals
}

Rules:
- Infer meal time from context clues (e.g. "for breakfast" → breakfast). Default to "lunch".
- If the user describes multiple foods, treat them as one combined meal entry.
- If the food is ambiguous or you need more info, set type to "clarification" and meal to null.
- If the message is not food-related, set type to "error" and meal to null.
- suggestions should be short (≤ 30 chars each), relevant follow-up foods or drinks.
- Never return anything outside the JSON object.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse & validate request body ──────────────────────────
  let body: {
    message: string;
    conversationHistory: ChatMessage[];
    userId: string;
    date: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, conversationHistory = [], userId, date } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (!userId?.trim()) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  // Extract the Firebase ID token from the Authorization header (optional).
  // When present it allows resolveGeminiKey to read the user's personal key
  // from Firestore via the REST API (authenticated as the calling user).
  const authHeader = req.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const apiKey = await resolveGeminiKey(userId, idToken);
  if (!apiKey) {
    // Graceful degradation: return a friendly error the UI can display
    const fallback: AIResponse = {
      type: "error",
      message:
        "AI food logging is not configured. Add a Gemini API key in Settings → AI, or ask your admin to set GEMINI_API_KEY.",
      meal: null,
      suggestions: [],
    };
    return NextResponse.json(fallback);
  }

  // ── 2. Build Gemini conversation contents ──────────────────────
  // Map our ChatMessage history to Gemini's { role, parts } format.
  // Skip model messages that carry embedded meal cards (they're UI-only).
  const priorContents = conversationHistory
    .filter((m) => m.role === "user" || m.role === "model")
    .map((m) => ({
      role: m.role === "model" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

  // Append the current user turn
  const contents = [
    ...priorContents,
    { role: "user" as const, parts: [{ text: message }] },
  ];

  // ── 3. Call Gemini ─────────────────────────────────────────────
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      // Gemini 2.5 replaced `googleSearchRetrieval` with `googleSearch`.
      // The SDK types (v0.24.x) predate this rename; bridge with a cast.
      tools: [
        { googleSearch: {} } as unknown as import("@google/generative-ai").Tool,
      ],
    });

    const result = await model.generateContent({ contents });
    const raw = result.response.text().trim();

    // Strip any accidental markdown fences the model may have added
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // ── 4. Parse & return ────────────────────────────────────────
    try {
      const parsed: AIResponse = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      console.error("[ai-log-food] JSON parse failed. Raw response:", raw);
      const fallback: AIResponse = {
        type: "error",
        message:
          "Could not understand the AI response. Please try rephrasing your meal description.",
        meal: null,
        suggestions: [],
      };
      return NextResponse.json(fallback);
    }
  } catch (err) {
    console.error("[ai-log-food] Gemini SDK error:", err);
    const fallback: AIResponse = {
      type: "error",
      message: "AI service is temporarily unavailable. Please try again in a moment.",
      meal: null,
      suggestions: [],
    };
    return NextResponse.json(fallback, { status: 502 });
  }
}
