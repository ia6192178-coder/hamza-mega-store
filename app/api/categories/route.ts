import { NextResponse } from 'next/server';
import { getCategoriesWithCounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public category feed — names, URL slugs and product counts. Falls back
// to the built-in list (with real counts) when the database or the
// categories table is missing, so it never fails.
export async function GET() {
  const categories = await getCategoriesWithCounts();
  return NextResponse.json({ categories });
}
