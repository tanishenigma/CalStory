/**
 * google-fit.ts — Google Fit REST API client wrapper.
 *
 * Works in web browsers only (not on the server). Uses the OAuth2
 * implicit flow so no client secret is needed in the browser.
 *
 * Flow:
 *  1. Call requestFitConsent()  → opens Google OAuth2 consent page
 *  2. After redirect, /api/fit/callback extracts the token from the URL
 *     fragment, stores it via setStoredToken, then redirects to /fitness.
 *  3. Call getFitnessData(date) → returns aggregated FitnessLog for that day
 *
 * Token is kept in sessionStorage only (per-tab, cleared on close).
 * It is NEVER written to Firestore or localStorage.
 */

import type { FitnessLog } from "@/app/types";

const TOKEN_KEY = "calstory_gfit_token";
const TOKEN_EXPIRY_KEY = "calstory_gfit_token_expiry";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID ?? "";

// Google Fit REST API — canonical base URL (fitness.googleapis.com).
// www.googleapis.com/fitness/v1 is a legacy alias that returns 400
// for some request shapes as of 2024.
const FIT_BASE = "https://fitness.googleapis.com/fitness/v1/users/me";

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
].join(" ");

export type FitSyncError =
  | "NO_CLIENT_ID"
  | "UNSUPPORTED_PLATFORM"
  | "PERMISSION_DENIED"
  | "TOKEN_EXPIRED"
  | "NETWORK_ERROR"
  | "PARSE_ERROR";

export interface FitSyncResult {
  ok: boolean;
  log?: FitnessLog;
  error?: FitSyncError;
  errorDetail?: string;
}

// ── Token helpers ──────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) ?? "0");
  if (Date.now() > expiry) {
    clearStoredToken();
    return null;
  }
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, expiresInSec: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(
    TOKEN_EXPIRY_KEY,
    String(Date.now() + expiresInSec * 1000),
  );
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function hasValidToken(): boolean {
  return getStoredToken() !== null;
}

// ── Consent / Auth ─────────────────────────────────────────────

/**
 * Opens the Google OAuth2 consent page.
 * After the user grants permission, Google redirects back to
 * /api/fit/callback which extracts the token from the URL fragment
 * and stores it, then redirects to /fitness.
 *
 * Returns false if NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID is not set.
 */
export function requestFitConsent(): boolean {
  if (!CLIENT_ID) return false;
  if (typeof window === "undefined") return false;

  const redirectUri = `${window.location.origin}/api/fit/callback`;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    include_granted_scopes: "true",
    state: Math.random().toString(36).slice(2),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return true;
}

// ── Data Fetching ──────────────────────────────────────────────

/**
 * Build the Google Fit aggregate request body for a single local day.
 *
 * Rules the API enforces (cause of HTTP 400 if violated):
 *  - startTimeMillis / endTimeMillis must be string-encoded int64 milliseconds.
 *  - bucketByTime.durationMillis must divide evenly into the requested window.
 *    Using exactly 86400000 (24 h) with a midnight-to-midnight UTC window is
 *    the safest choice — a fractional-hour window (e.g. 86399001 ms) is
 *    rejected with HTTP 400.
 *  - The window is expressed in UTC. We convert the local YYYY-MM-DD date to
 *    the UTC midnight boundaries so the bucket aligns with local-day intent
 *    while satisfying the API's 24 h divisibility requirement.
 */
function buildAggregateBody(dateKey: string): object {
  // Parse YYYY-MM-DD as a LOCAL calendar date (not UTC). Then convert to
  // UTC milliseconds so the start/end boundary is midnight-to-midnight for
  // the user's local day, expressed in UTC epoch ms.
  const [year, month, day] = dateKey.split("-").map(Number);
  // Local midnight → UTC ms
  const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
  const startMs = startLocal.getTime();
  // Exactly 24 h later
  const endMs = startMs + 86_400_000;

  return {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      // com.google.calories.expended = total active calories burned.
      // We intentionally omit com.google.calories.bmr — it requires a
      // registered BMR datasource (e.g. a paired fitness tracker). If no
      // such source exists the API rejects the entire request with HTTP 400.
      // BMR can be calculated from profile data (height/weight/age) if needed.
      { dataTypeName: "com.google.calories.expended" },
    ],
    // durationMillis MUST equal the total window length for a single-bucket
    // daily aggregate. Any other value causes HTTP 400.
    bucketByTime: { durationMillis: "86400000" },
    startTimeMillis: String(startMs),
    endTimeMillis: String(endMs),
  };
}

/**
 * Fetch aggregated fitness data for a given local date.
 * Uses the Google Fit Aggregates API (cumulative sum) — never manually
 * sums raw samples across sources.
 */
export async function getFitnessData(dateKey: string): Promise<FitSyncResult> {
  const token = getStoredToken();
  if (!token) {
    return { ok: false, error: "TOKEN_EXPIRED" };
  }

  let resp: Response;
  try {
    resp = await fetch(`${FIT_BASE}/dataset:aggregate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildAggregateBody(dateKey)),
    });
  } catch {
    return { ok: false, error: "NETWORK_ERROR", errorDetail: "Fetch failed" };
  }

  if (resp.status === 401 || resp.status === 403) {
    clearStoredToken();
    return { ok: false, error: "PERMISSION_DENIED" };
  }

  if (!resp.ok) {
    // Log the response body for 400s — the API includes a human-readable
    // error message that makes diagnosing request format issues much easier.
    let detail = `HTTP ${resp.status}`;
    try {
      const errBody = await resp.json();
      const apiMsg =
        errBody?.error?.message ?? errBody?.error?.status ?? null;
      if (apiMsg) detail = `HTTP ${resp.status}: ${apiMsg}`;
    } catch {
      // ignore parse error — use the status code alone
    }
    console.error("[google-fit] aggregate error:", detail);
    return {
      ok: false,
      error: "NETWORK_ERROR",
      errorDetail: detail,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any;
  try {
    json = await resp.json();
  } catch {
    return { ok: false, error: "PARSE_ERROR" };
  }

  let steps = 0;
  let activeCalories = 0;

  for (const bucket of json?.bucket ?? []) {
    for (const ds of bucket?.dataset ?? []) {
      for (const point of ds?.point ?? []) {
        const v = point?.value?.[0];
        if (!v) continue;
        // Google Fit values are either intVal (steps) or fpVal (calories)
        const val: number = v.intVal ?? v.fpVal ?? 0;
        if (!val) continue;
        // dataSourceId is a derived string like:
        //   "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        // We match on the embedded data type segment, not the full ID.
        const dsId: string = ds?.dataSourceId ?? "";
        if (dsId.includes("step_count")) {
          steps += Math.round(val);
        } else if (dsId.includes("calories.expended")) {
          activeCalories += Math.round(val);
        }
      }
    }
  }

  const log: FitnessLog = {
    date: dateKey,
    steps,
    activeCalories,
    // basalCalories is not fetched from Google Fit (requires a device-specific
    // BMR datasource). Set to 0; derive from profile if needed.
    basalCalories: 0,
    source: "google_fit",
    syncedAt: Date.now(),
  };

  return { ok: true, log };
}
