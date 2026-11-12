import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { hasDb, mapProduct } from '@/lib/db';
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

type RouteContext = { params: { id: string } };

export async function PUT(req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const { product, error } = parseProductBody(body);
    if (!product) {
      return NextResponse.json({ error: error ?? 'Invalid product.' }, { status: 400 });
    }
    const { rows } = await sql`
      UPDATE products SET
        name = ${product.name},
        category = ${product.category},
        price = ${product.price},
        old_price = ${product.old_price},
        description = ${product.description},
        image_url = ${product.image_url},
        stock = ${product.stock},
        is_new = ${product.is_new},
        is_best_seller = ${product.is_best_seller},
        is_clearance = ${product.is_clearance},
        is_sold_out = ${product.is_sold_out},
        rating = ${product.rating}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      product: mapProduct(rows[0] as Record<string, unknown>),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update the product.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });
  }
  try {
    const { rowCount } = await sql`DELETE FROM products WHERE id = ${id}`;
    if ((rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not delete the product.' },
      { status: 500 },
    );
  }
}
