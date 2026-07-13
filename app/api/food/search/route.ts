/**
 * /api/food/search
 *
 * Proxies keyword searches to the USDA FoodData Central API.
 */
import { NextResponse } from "next/server";
import { searchFoods } from "@/app/lib/usda";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const data = await searchFoods(query.trim());
    return NextResponse.json({ foods: { food: data.foods || [] } });
  } catch (error: any) {
    console.error("[api/food/search] USDA error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to search foods" },
      { status: 500 },
    );
  }
}
