import { NextResponse } from 'next/server';
import { searchFoods } from '@/app/lib/fatsecret';
import Fuse from 'fuse.js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    // Get a broader set of results using just the first word, which bypasses
    // FatSecret's rigid multi-word exact matching limits.
    const searchWord = query.trim().split(/\s+/)[0];
    const data = await searchFoods(searchWord);
    
    let foods = data?.foods?.food || [];
    if (!Array.isArray(foods)) {
      foods = foods ? [foods] : [];
    }
    
    if (foods.length === 0) {
      return NextResponse.json({ foods: { food: [] } });
    }

    // If it's a single-word query, FatSecret's native search and sorting is already optimal.
    if (query.trim().split(/\s+/).length === 1) {
      return NextResponse.json({ foods: { food: foods.slice(0, 10) } });
    }

    // For multi-word queries, apply fuzzy search over the 50 fetched results using the full query
    const fuse = new Fuse(foods, {
      keys: ['food_name', 'food_description'],
      threshold: 0.5, // Increased threshold for more lenient fuzzy matching
      ignoreLocation: true,
      includeScore: true
    });
    
    // Fallback to all foods if the query doesn't yield anything from Fuse
    let results = fuse.search(query).map(r => r.item);
    if (results.length === 0) {
      results = foods;
    }
    
    // Return top 10 to the frontend in the original expected format
    return NextResponse.json({ foods: { food: results.slice(0, 10) } });
  } catch (error) {
    console.error('Error searching foods:', error);
    return NextResponse.json({ error: 'Failed to search foods' }, { status: 500 });
  }
}
