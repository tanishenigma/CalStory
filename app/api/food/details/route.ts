import { NextResponse } from 'next/server';
import { getFoodDetails } from '@/app/lib/fatsecret';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Query parameter "id" is required' }, { status: 400 });
  }

  try {
    const data = await getFoodDetails(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting food details:', error);
    return NextResponse.json({ error: 'Failed to get food details' }, { status: 500 });
  }
}
