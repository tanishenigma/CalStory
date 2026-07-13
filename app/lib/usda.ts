/**
 * usda.ts — SERVER ONLY
 *
 * USDA FoodData Central API client.
 * Uses a DEMO_KEY by default which is rate-limited.
 * To increase limits, users can get a free key at https://fdc.nal.usda.gov/api-key-signup.html
 */

export interface USDANutrient {
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: USDANutrient[];
}

export interface USDASearchResponse {
  totalHits: number;
  foods: USDAFood[];
}

export async function searchFoods(query: string): Promise<USDASearchResponse> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "15");

  const res = await fetch(url.href, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("[USDA] 429 Too Many Requests. The DEMO_KEY rate limit has been reached. Please get a free API key at fdc.nal.usda.gov.");
    }
    throw new Error(`[USDA] Request failed: ${res.statusText}`);
  }

  return res.json() as Promise<USDASearchResponse>;
}
