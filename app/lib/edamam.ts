/**
 * edamam.ts — SERVER ONLY
 *
 * Edamam Food Database API v2 client.
 * Credentials are read dynamically from process.env.
 *
 * @security All fetch URLs are verified against ALLOWED_ORIGIN.
 */

const ALLOWED_ORIGIN = "https://api.edamam.com";

function assertAllowedOrigin(url: string): void {
  const parsed = new URL(url);
  if (parsed.origin !== ALLOWED_ORIGIN) {
    throw new Error(
      `[edamam] Blocked fetch to disallowed origin: ${parsed.origin}`,
    );
  }
}

function requireCreds() {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("Missing EDAMAM_APP_ID or EDAMAM_APP_KEY in environment");
  }
  return { appId, appKey };
}

/** Per-100g nutrients returned by the parser. */
export interface EdamamNutrients {
  ENERC_KCAL?: number; // kcal
  PROCNT?: number; // protein g
  CHOCDF?: number; // carbs g
  FAT?: number; // fat g
  FIBTG?: number; // fiber g
  SUGAR?: number; // sugar g
  NA?: number; // sodium mg
  K?: number; // potassium mg
  CA?: number; // calcium mg
  FE?: number; // iron mg
}

export interface EdamamHint {
  food: {
    foodId: string;
    label: string;
    knownAs?: string;
    nutrients: EdamamNutrients;
    category: string;
    categoryLabel: string;
    image?: string;
  };
  measures: {
    uri: string;
    label: string;
    weight: number;
  }[];
}

export interface EdamamParseResponse {
  text: string;
  parsed: any[];
  hints: EdamamHint[];
  _links: any;
}

export async function searchFoods(query: string): Promise<EdamamParseResponse> {
  const { appId, appKey } = requireCreds();

  const url = new URL("https://api.edamam.com/api/food-database/v2/parser");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("ingr", query);

  assertAllowedOrigin(url.href);

  const res = await fetch(url.href, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    throw new Error(
      "[edamam] 401 Unauthorized. Ensure you are using the 'Food Database API' key, not the 'Recipe API' key, and that you have restarted the server.",
    );
  }

  if (!res.ok) {
    throw new Error(`[edamam] Parser request failed: ${res.statusText}`);
  }

  return res.json() as Promise<EdamamParseResponse>;
}
