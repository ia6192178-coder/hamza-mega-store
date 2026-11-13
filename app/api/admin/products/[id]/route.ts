import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import {
  ensureVariantSchema,
  getProduct,
  getProductImageValues,
  hasDb,
  resolveImageValue,
  saveProductVariants,
} from '@/lib/db';
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
    // Make sure the variants table AND the gallery column exist before the
    // update (in case /api/seed was not run after the update).
    await ensureVariantSchema();
    // Photos the owner did not touch come back as /api/image URLs — resolve
    // those to the stored values so they are kept. Fresh uploads (data
    // URLs) and pasted links are stored as-is; removed photos arrive as
    // empty strings and are dropped.
    const existing = await getProductImageValues(id);
    const imageUrl = resolveImageValue(product.image_url, id, existing);
    const gallery = product.gallery.map((g) =>
      resolveImageValue(g, id, existing),
    );
    const { rows } = await sql`
      UPDATE products SET
        name = ${product.name},
        category = ${product.category},
        price = ${product.price},
        old_price = ${product.old_price},
        description = ${product.description},
        image_url = ${imageUrl},
        gallery = ${JSON.stringify(gallery)},
        stock = ${product.stock},
        is_new = ${product.is_new},
        is_best_seller = ${product.is_best_seller},
        is_clearance = ${product.is_clearance},
        is_sold_out = ${product.is_sold_out},
        rating = ${product.rating},
        variant_label = ${product.variant_label}
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    // Replace the variant rows (empty list clears them — the product becomes
    // simple again). The schema guard covers a missed /api/seed run.
    await saveProductVariants(id, product.variants);
    const updated = await getProduct(id);
    return NextResponse.json({ ok: true, product: updated });
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
