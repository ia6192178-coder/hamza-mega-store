import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { getProducts, hasDb, mapProduct } from '@/lib/db';
import { parseProductBody } from '@/lib/product-input';

export const dynamic = 'force-dynamic';

async function requireAdminResponse(): Promise<NextResponse | null> {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  return null;
}

export async function GET() {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { product, error } = parseProductBody(body);
    if (!product) {
      return NextResponse.json({ error: error ?? 'Invalid product.' }, { status: 400 });
    }
    const { rows } = await sql`
      INSERT INTO products
        (name, category, price, old_price, description, image_url, stock,
         is_new, is_best_seller, is_clearance, is_sold_out, rating)
      VALUES
        (${product.name}, ${product.category}, ${product.price}, ${product.old_price},
         ${product.description}, ${product.image_url}, ${product.stock},
         ${product.is_new}, ${product.is_best_seller}, ${product.is_clearance},
         ${product.is_sold_out}, ${product.rating})
      RETURNING *
    `;
    return NextResponse.json(
      { ok: true, product: mapProduct(rows[0] as Record<string, unknown>) },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not add the product.' },
      { status: 500 },
    );
  }
}
