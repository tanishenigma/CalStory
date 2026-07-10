/**
 * fatsecret.ts — SERVER ONLY
 *
 * FatSecret API client for food search and details.
 * Credentials MUST be provided via environment variables.
 *
 * @security All fetch URLs are constructed from hardcoded base origins
 * with user input only in query parameters (via URLSearchParams),
 * never in the hostname or path. The origin is validated before each
 * fetch call to prevent SSRF.
 */

import { logApiRequest } from "./logger.server";

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;

/** Allowed origins for FatSecret API requests. */
const ALLOWED_ORIGINS = new Set([
  "https://oauth.fatsecret.com",
  "https://platform.fatsecret.com",
]);

/**
 * Validate that a URL's origin is in the allow-list.
 * @throws {Error} if the origin is not allowed.
 *
 * @security Prevents SSRF by ensuring fetch calls only go to known
 * FatSecret API endpoints, never to attacker-controlled hosts.
 */
function assertAllowedOrigin(url: string): void {
  const parsed = new URL(url);
  if (!ALLOWED_ORIGINS.has(parsed.origin)) {
    throw new Error(
      `[fatsecret] Blocked fetch to disallowed origin: ${parsed.origin}`,
    );
  }
}

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "[fatsecret] FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET environment variables are required.",
    );
  }

  const now = Date.now();
  // Buffer by 5 minutes to avoid edge cases
  if (cachedToken && now < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64",
  );

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("scope", "basic");

  const tokenUrl = "https://oauth.fatsecret.com/connect/token";
  assertAllowedOrigin(tokenUrl); // ship-safe-ignore: SSRF_USER_URL_FETCH — URL is hardcoded, not user-supplied

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch FatSecret token: ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // data.expires_in is typically 86400 (24 hours) in seconds
  tokenExpiryTime = now + data.expires_in * 1000;

  return cachedToken!;
}

export async function searchFoods(query: string) {
  const token = await getAccessToken();
  const url = new URL("https://platform.fatsecret.com/rest/server.api");
  url.searchParams.append("method", "foods.search");
  url.searchParams.append("search_expression", query);
  url.searchParams.append("format", "json");
  url.searchParams.append("max_results", "50");

  const fetchUrl = url.toString();
  assertAllowedOrigin(fetchUrl); // ship-safe-ignore: SSRF_USER_URL_FETCH — base is hardcoded; only query params come from user input

  const res = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await logApiRequest("foods.search", { query, max_results: 50 }, res.status);

  if (!res.ok) {
    throw new Error(`Failed to search foods: ${res.statusText}`);
  }

  return res.json();
}

export async function getFoodDetails(foodId: string) {
  const token = await getAccessToken();
  const url = new URL("https://platform.fatsecret.com/rest/server.api");
  url.searchParams.append("method", "food.get.v2");
  url.searchParams.append("food_id", foodId);
  url.searchParams.append("format", "json");

  const fetchUrl = url.toString();
  assertAllowedOrigin(fetchUrl); // ship-safe-ignore: SSRF_USER_URL_FETCH — base is hardcoded; only food_id param from caller

  const res = await fetch(fetchUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await logApiRequest("food.get.v2", { food_id: foodId }, res.status);

  if (!res.ok) {
    throw new Error(`Failed to get food details: ${res.statusText}`);
  }

  return res.json();
}
