import { NextResponse } from 'next/server';
import { getProducts, searchProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public product feed — used by the header live search.
// GET /api/products?search=shoes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('search') || '').trim();
  const products = q ? await searchProducts(q) : await getProducts();
  return NextResponse.json({ products });
}
