const CLIENT_ID =
  process.env.FATSECRET_CLIENT_ID || "72e3be5c0b6c420b80958a9097fc2647";
const CLIENT_SECRET =
  process.env.FATSECRET_CLIENT_SECRET || "9975c0298b8b4241bd78f28e6c83e7c1";
import { logApiRequest } from "./logger.server";

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

async function getAccessToken(): Promise<string> {
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

  const res = await fetch("https://oauth.fatsecret.com/connect/token", {
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

  const res = await fetch(url.toString(), {
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

  const res = await fetch(url.toString(), {
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
