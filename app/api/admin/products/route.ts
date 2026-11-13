import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import {
  ensureCategoryExists,
  ensureCategorySchema,
  ensureVariantSchema,
  getProduct,
  getProducts,
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
    // Make sure the variants table AND the gallery column exist before the
    // insert (in case /api/seed was not run after the update) — the insert
    // below writes the gallery column, so the migration must run first.
    await ensureVariantSchema();
    // And make sure the product's category exists in the categories table,
    // so it shows up in the category list and storefront tiles.
    await ensureCategorySchema();
    await ensureCategoryExists(product.category);
    // A new product has no stored images, so any /api/image URL in the
    // payload is stripped; uploads (data URLs) and pasted links pass through.
    const imageUrl = resolveImageValue(product.image_url, -1, null);
    const gallery = product.gallery.map((g) =>
      resolveImageValue(g, -1, null),
    );
    const { rows } = await sql`
      INSERT INTO products
        (name, category, price, old_price, description, image_url, gallery, stock,
         is_new, is_best_seller, is_clearance, is_sold_out, rating, variant_label)
      VALUES
        (${product.name}, ${product.category}, ${product.price}, ${product.old_price},
         ${product.description}, ${imageUrl}, ${JSON.stringify(gallery)}, ${product.stock},
         ${product.is_new}, ${product.is_best_seller}, ${product.is_clearance},
         ${product.is_sold_out}, ${product.rating}, ${product.variant_label})
      RETURNING id
    `;
    const newId = Number(rows[0].id);
    // Save the variant rows (empty list = simple product).
    await saveProductVariants(newId, product.variants);
    const created = await getProduct(newId);
    return NextResponse.json({ ok: true, product: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not add the product.' },
      { status: 500 },
    );
  }
}
