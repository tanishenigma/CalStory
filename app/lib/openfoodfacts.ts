/**
 * openfoodfacts.ts — SERVER ONLY
 *
 * Open Food Facts API client.
 * 100% Free, NO API keys required!
 */

import { logApiRequest } from "./logger.server";

export interface OFFNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  sodium_100g?: number;
}

export interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriments?: OFFNutriments;
}

export interface OFFSearchResponse {
  count: number;
  page: number;
  page_size: number;
  products: OFFProduct[];
}

/**
 * Search for foods by keyword.
 * Returns products with per-100g nutrient data.
 */
export async function searchFoods(query: string): Promise<OFFSearchResponse> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", "code,product_name,brands,nutriments"); // Optimize payload

  const fetchUrl = url.toString();

  const res = await fetch(fetchUrl, {
    headers: {
      "User-Agent": "CalStory/1.0 - Calorie Tracker",
    },
    cache: "no-store",
  });

  await logApiRequest("openfoodfacts.search", { query }, res.status);

  if (!res.ok) {
    throw new Error(`[OFF] Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<OFFSearchResponse>;
}
