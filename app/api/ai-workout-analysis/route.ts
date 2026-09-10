import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  authenticateFirebaseRequest,
  isNextResponse,
} from "@/app/lib/server-auth";
import { resolveGeminiKey } from "@/app/lib/gemini-key";
import {
  hasProSubscription,
} from "@/app/lib/polar-billing";

type AnalysisSet = { reps: number; kg: number };

type AnalysisWorkout = {
  date: string;
  name: string;
  type: string;
  duration: number;
  exercises: Array<{
    name: string;
    sets: AnalysisSet[];
    metrics: Record<string, string | number>;
  }>;
  notes: string;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength)
    : "";
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function normalizeWorkout(value: unknown, fallbackDate: string): AnalysisWorkout | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const date = DATE_KEY.test(cleanText(raw.date, 10))
    ? cleanText(raw.date, 10)
    : fallbackDate;
  const rawExercises = Array.isArray(raw.exercises) ? raw.exercises : [];

  return {
    date,
    name: cleanText(raw.name, 100) || "Unnamed workout",
    type: cleanText(raw.type, 40) || "Other",
    duration: Math.round(finiteNumber(raw.duration)),
    exercises: rawExercises.slice(0, 20).flatMap((exercise) => {
      if (!exercise || typeof exercise !== "object") return [];
      const item = exercise as Record<string, unknown>;
      const rawSets = Array.isArray(item.sets) ? item.sets : [];
      const metrics: Record<string, string | number> = {};
      if (item.metrics && typeof item.metrics === "object") {
        for (const [key, metric] of Object.entries(
          item.metrics as Record<string, unknown>,
        ).slice(0, 8)) {
          const safeKey = cleanText(key, 30);
          if (!safeKey) continue;
          if (typeof metric === "number" && Number.isFinite(metric)) {
            metrics[safeKey] = metric;
            continue;
          }
          const text = cleanText(metric, 80);
          if (text) metrics[safeKey] = text;
        }
      }

      return [
        {
          name: cleanText(item.name, 80) || "Unnamed exercise",
          sets: rawSets.slice(0, 30).flatMap((set) => {
            if (!set || typeof set !== "object") return [];
            const currentSet = set as Record<string, unknown>;
            return [
              {
                reps: Math.round(finiteNumber(currentSet.reps)),
                kg: finiteNumber(currentSet.kg),
              },
            ];
          }),
          metrics,
        },
      ];
    }),
    notes: cleanText(raw.notes, 300),
  };
}

const SYSTEM_PROMPT = `You are an evidence-based strength coach inside CalStory.
Compare the user's current workout with their previous logged workouts.
Only use the data supplied. Never invent weights, reps, dates, personal records, or trends.
Give concise, practical feedback in Markdown with exactly these sections:
## What improved
## What changed
## Next session

Mention concrete exercise, set, rep, volume, duration, or consistency changes when the data supports them.
If there is not enough history for a conclusion, say so plainly.
Keep the response under 350 words. Do not give medical advice.`;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await authenticateFirebaseRequest(req);
  if (isNextResponse(auth)) return auth;

  // Entitlement is checked before parsing/sending workout data to Gemini.
  if (!(await hasProSubscription(auth.uid))) {
    return NextResponse.json(
      {
        error: "Workout comparison is available on the Pro plan.",
        upgradeRequired: true,
      },
      { status: 403 },
    );
  }

  let body: { currentDate?: unknown; currentWorkouts?: unknown; pastWorkouts?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const currentDate = cleanText(body.currentDate, 10);
  if (!DATE_KEY.test(currentDate)) {
    return NextResponse.json(
      { error: "currentDate must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const currentWorkouts = (Array.isArray(body.currentWorkouts)
    ? body.currentWorkouts
    : []
  )
    .slice(0, 5)
    .flatMap((workout) => {
      const normalized = normalizeWorkout(workout, currentDate);
      return normalized ? [normalized] : [];
    });
  const pastWorkouts = (Array.isArray(body.pastWorkouts)
    ? body.pastWorkouts
    : []
  )
    .slice(0, 20)
    .flatMap((workout) => {
      const normalized = normalizeWorkout(workout, currentDate);
      return normalized ? [normalized] : [];
    });

  if (currentWorkouts.length === 0) {
    return NextResponse.json(
      { error: "At least one current workout is required." },
      { status: 400 },
    );
  }

  const apiKey = await resolveGeminiKey(auth.uid, auth.idToken);
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI workout analysis is not configured yet." },
      { status: 503 },
    );
  }

  const prompt = `${SYSTEM_PROMPT}

CURRENT WORKOUTS (${currentDate}):
${JSON.stringify(currentWorkouts)}

PREVIOUS WORKOUTS:
${JSON.stringify(pastWorkouts)}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.25 },
    });
    const result = await model.generateContent(prompt);
    const analysis = result.response
      .text()
      .trim()
      .replace(/^```(?:markdown)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    return NextResponse.json({ analysis: analysis.slice(0, 12_000) });
  } catch (error) {
    console.error("[ai-workout-analysis] Gemini error:", error);
    return NextResponse.json(
      { error: "Workout analysis is temporarily unavailable." },
      { status: 503 },
    );
  }
}
