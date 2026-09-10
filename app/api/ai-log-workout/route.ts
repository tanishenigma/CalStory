import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Tool } from "@google/generative-ai";
import type { WorkoutAIResponse, WorkoutChatMessage } from "@/app/types";
import { resolveGeminiKey } from "@/app/lib/gemini-key";
import {
  sanitizeMessage,
  sanitizeHistory,
} from "@/app/lib/sanitize-input";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { consumePrompt } from "@/app/lib/ai-quota";
import { FREE_DAILY_PROMPT_LIMIT } from "@/app/lib/plan-limits";

/* ------------------------------------------------------------------
 * System prompt — parses free-form workout descriptions into JSON.
 * Model: gemini-2.5-flash with googleSearch grounding.
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are a workout logging assistant for CalStory, a fitness tracking app.
The user will describe their workout in natural language — they may list exercises line by line,
specify sets/reps/weight in any format, or mix cardio and strength work.

Your job is to parse the description into a structured workout object.

CRITICAL: Always respond with ONLY valid JSON — no markdown, no code fences, no extra text.
Match this exact TypeScript shape:
{
  "type": "confirmation" | "clarification" | "error",
  "message": string,           // 1-2 friendly sentences confirming what you parsed
  "workout": {                 // null when type is "clarification" or "error"
    "name": string,            // infer from exercises if not given (e.g. "Pull Day", "Upper Body")
    "type": string,            // one of: Resistance, Cardio, Yoga, HIIT, Pilates, CrossFit, Powerlifting, Flexibility, Sports, Other
    "duration": number,        // minutes — use what the user says, else default 60
    "exercises": [
      {
        "name": string,        // exercise name, standardised (e.g. "Lat Pulldown", "Pull-up")
        "sets": [
          {
            "reps": number,    // integer
            "kg": number,      // 0 if bodyweight
            "note": string     // optional — e.g. "drop set", "failure", "warm-up"
          }
        ]
      }
    ],
    "notes": string            // any extra context the user mentioned
  } | null,
  "askSaveTemplate": boolean,  // true when the workout looks like a regular routine (3+ exercises)
  "suggestions": string[]      // 2-3 short follow-up chips, e.g. "Add cardio finisher", "Log protein shake"
}

Parsing rules:
- "12 reps" with no weight → kg: 0 (bodyweight)
- "35kg 12 reps" or "12 reps @ 35kg" → reps: 12, kg: 35
- "8 reps + drop" → note: "drop set"
- Multiple weight/rep combos for the same exercise = multiple sets
- If the user lists exercises without a workout name, infer one (e.g. "Back & Biceps", "Push Day")
- If the workout type is ambiguous, default to "Resistance"
- If the description is too vague (e.g. "I worked out"), set type to "clarification", workout to null
- Never return anything outside the JSON object`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  // ── 1. Parse & validate ────────────────────────────────────────
  let body: {
    message: string;
    conversationHistory: WorkoutChatMessage[];
    date: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    message: rawMessage,
    conversationHistory: rawHistory = [],
    date,
  } = body;

  const message = sanitizeMessage(rawMessage ?? "");
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  let promptUsage;
  try {
    promptUsage = await consumePrompt(auth.uid, auth.idToken);
  } catch (error) {
    console.error("[ai-log-workout] Prompt quota check failed:", error);
    return NextResponse.json(
      { error: "Prompt limit is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  if (!promptUsage.allowed) {
    return NextResponse.json(
      {
        type: "error",
        message:
          `You’ve used all ${FREE_DAILY_PROMPT_LIMIT} free AI prompts for today. Upgrade to Plus or Pro for unlimited prompts.`,
        workout: null,
        askSaveTemplate: false,
        suggestions: [],
        promptUsage,
        upgradeRequired: true,
      },
      { status: 429 },
    );
  }

  const apiKey = await resolveGeminiKey(auth.uid, auth.idToken);
  if (!apiKey) {
    const fallback: WorkoutAIResponse = {
      type: "error",
      message:
        "AI workout logging is not configured yet. Please try again later or contact support.",
      workout: null,
      askSaveTemplate: false,
      suggestions: [],
    };
    return NextResponse.json(fallback);
  }

  // ── 2. Build Gemini conversation ───────────────────────────────
  const sanitizedHistory = sanitizeHistory(
    rawHistory as Array<{ role: string; content: string }>,
  );
  const priorContents = sanitizedHistory
    .map((m) => ({
      role: m.role === "model" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

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
      tools: [{ googleSearch: {} } as unknown as Tool],
    });

    const result = await model.generateContent({ contents });
    const raw = result.response.text().trim();

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      // Strip common leading wrappers the model occasionally emits.
      .replace(/^\s*JSON\s*[:\-]?\s*/i, "")
      .replace(
        /^\s*(Here(?:'s| is) the (?:parsed )?(?:workout|JSON)[^:]*:?\s*)/i,
        "",
      )
      // Normalise smart quotes so JSON tokens stay ASCII.
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();

    const tryParse = (input: string): WorkoutAIResponse | null => {
      // Attempt 1: direct parse.
      try {
        return JSON.parse(input) as WorkoutAIResponse;
      } catch {
        // noop
      }

      // Attempt 2: strip trailing commas before } or ].
      const noTrailing = input.replace(/,(\s*[}\]])/g, "$1");
      try {
        return JSON.parse(noTrailing) as WorkoutAIResponse;
      } catch {
        // noop
      }

      // Attempt 3: replace single-quoted strings with double quotes,
      // then strip trailing commas again. Conservative — only touches
      // outer-string-y regions; JSON keys/values are the usual offenders.
      const doubleQuoted = noTrailing
        .replace(/'((?:\\.|[^'\\])*)'(?=\s*:)/g, '"$1"')
        .replace(/:\s*'((?:\\.|[^'\\])*)'/g, ': "$1"')
        .replace(/,(\s*[}\]])/g, "$1");
      try {
        return JSON.parse(doubleQuoted) as WorkoutAIResponse;
      } catch {
        // noop
      }

      // Attempt 4: strip JS-style // and /* */ comments (model rarely adds
      // these but cheap to try before giving up).
      const noComments = doubleQuoted
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      try {
        return JSON.parse(noComments) as WorkoutAIResponse;
      } catch {
        return null;
      }
    };

    const parsed = tryParse(cleaned);
    if (parsed) {
      return NextResponse.json(parsed);
    }

    console.error("[ai-log-workout] JSON parse failed. Raw:", raw);
    const fallback: WorkoutAIResponse = {
      type: "error",
      message:
        "Could not parse the AI response. Please try rephrasing your workout description.",
      workout: null,
      askSaveTemplate: false,
      suggestions: [],
    };
    return NextResponse.json(fallback);
  } catch (err) {
    console.error("[ai-log-workout] Gemini SDK error:", err);
    const fallback: WorkoutAIResponse = {
      type: "error",
      message: "AI service is temporarily unavailable. Please try again.",
      workout: null,
      askSaveTemplate: false,
      suggestions: [],
    };
    return NextResponse.json(fallback, { status: 502 });
  }
}
