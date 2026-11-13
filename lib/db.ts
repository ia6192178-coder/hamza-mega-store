import { sql } from '@vercel/postgres';
import { DEFAULT_SETTINGS } from './seed-data';
import type { Order, OrderItem, Product, ProductVariant, Settings } from './types';

export function hasDb(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

// Idempotent DDL for the variants feature (v2) and the photo gallery (v3).
// Safe to run any time — every statement is IF NOT EXISTS, and re-running
// changes nothing. The /api/seed route runs it, and the admin/order APIs
// call it lazily (once per serverless instance) so the features work even
// if the owner forgets to visit /api/seed after deploying the update.
const VARIANT_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    price NUMERIC NOT NULL,
    old_price NUMERIC,
    stock INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_label TEXT`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label TEXT`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_price NUMERIC`,
  // v3 — extra product photos, stored as a JSON array of image strings
  // (base64 data URLs for uploads, remote URLs for pasted links).
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery TEXT NOT NULL DEFAULT '[]'`,
];

let variantSchemaPromise: Promise<void> | null = null;

export function ensureVariantSchema(): Promise<void> {
  if (!hasDb()) return Promise.resolve();
  if (!variantSchemaPromise) {
    variantSchemaPromise = (async () => {
      for (const statement of VARIANT_SCHEMA_SQL) {
        await sql.query(statement);
      }
    })().catch((err) => {
      // Allow a later call to retry.
      variantSchemaPromise = null;
      throw err;
    });
  }
  return variantSchemaPromise;
}

// Parse the gallery JSON column into an array of image strings. Returns
// [] when the column is missing (migration not run yet), empty or invalid
// — the store keeps working exactly as before.
export function parseGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v !== '');
  }
  if (typeof value !== 'string' || value.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === 'string' && v !== '',
    );
  } catch {
    return [];
  }
}

// Uploaded photos are stored as base64 data URLs. Those must never reach
// the browser inside page data (a listing page would carry megabytes of
// images) — instead the storefront gets a light /api/image URL that serves
// the binary on demand. Remote URLs pass through unchanged.
function publicImageUrl(productId: number, value: string, index: number): string {
  if (!value) return '';
  if (value.startsWith('data:')) {
    return `/api/image?product=${productId}&i=${index}`;
  }
  return value;
}

// Postgres returns NUMERIC as string, so normalise every row before use.
export function mapProduct(row: Record<string, unknown>): Product {
  const id = Number(row.id);
  const gallery = parseGallery(row.gallery);
  return {
    id,
    name: String(row.name ?? ''),
    category: String(row.category ?? ''),
    price: Number(row.price ?? 0),
    old_price: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
    description: String(row.description ?? ''),
    image_url: publicImageUrl(id, String(row.image_url ?? ''), 0),
    gallery: gallery.map((g, i) => publicImageUrl(id, g, i + 1)),
    stock: Number(row.stock ?? 0),
    is_new: Boolean(row.is_new),
    is_best_seller: Boolean(row.is_best_seller),
    is_clearance: Boolean(row.is_clearance),
    is_sold_out: Boolean(row.is_sold_out),
    rating: Number(row.rating ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
    variant_label:
      row.variant_label === null || row.variant_label === undefined
        ? null
        : String(row.variant_label),
    variants: [],
  };
}

export function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: Number(row.id),
    product_id: Number(row.product_id),
    label: String(row.label ?? ''),
    price: Number(row.price ?? 0),
    old_price: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
    stock: Number(row.stock ?? 0),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: Number(row.id),
    order_number: String(row.order_number ?? ''),
    customer_name: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    address: String(row.address ?? ''),
    total: Number(row.total ?? 0),
    delivery_fee: Number(row.delivery_fee ?? 0),
    status: String(row.status ?? 'Pending'),
    created_at: row.created_at ? String(row.created_at) : '',
  };
}

export function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: Number(row.id),
    order_id: Number(row.order_id),
    product_id:
      row.product_id === null || row.product_id === undefined
        ? null
        : Number(row.product_id),
    product_name: String(row.product_name ?? ''),
    price: Number(row.price ?? 0),
    quantity: Number(row.quantity ?? 0),
    variant_label:
      row.variant_label === null || row.variant_label === undefined
        ? null
        : String(row.variant_label),
    variant_price:
      row.variant_price === null || row.variant_price === undefined
        ? null
        : Number(row.variant_price),
  };
}

// ---------- Settings (key-value) ----------

export async function getSettings(): Promise<Settings> {
  const merged: Settings = { ...DEFAULT_SETTINGS };
  if (!hasDb()) return merged;
  try {
    const { rows } = await sql`SELECT key, value FROM settings`;
    for (const row of rows) {
      merged[String(row.key)] = String(row.value);
    }
  } catch {
    // Database not set up yet (or unreachable) — fall back to defaults.
  }
  return merged;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

// ---------- Products ----------

// Attach each product's variants (one extra query per call). If the
// product_variants table does not exist yet (owner has not run /api/seed
// after the update), this fails silently and products simply have no
// variants — the store keeps working exactly as before.
async function attachVariants(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  try {
    const ids = products.map((p) => p.id);
    const { rows } = await sql.query(
      `SELECT * FROM product_variants WHERE product_id = ANY($1::int[]) ORDER BY sort_order ASC, id ASC`,
      [ids],
    );
    const byProduct = new Map<number, ProductVariant[]>();
    for (const r of rows) {
      const v = mapVariant(r as Record<string, unknown>);
      const list = byProduct.get(v.product_id) ?? [];
      list.push(v);
      byProduct.set(v.product_id, list);
    }
    for (const p of products) p.variants = byProduct.get(p.id) ?? [];
  } catch {
    for (const p of products) p.variants = [];
  }
  return products;
}

// Replace-all: delete a product's variants, then insert the new list in
// order. Callers must have run ensureVariantSchema() first.
export async function saveProductVariants(
  productId: number,
  variants: { label: string; price: number; old_price: number | null; stock: number }[],
): Promise<void> {
  await sql`DELETE FROM product_variants WHERE product_id = ${productId}`;
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    await sql`
      INSERT INTO product_variants (product_id, label, price, old_price, stock, sort_order)
      VALUES (${productId}, ${v.label}, ${v.price}, ${v.old_price}, ${v.stock}, ${i})
    `;
  }
}

export async function getVariant(id: number): Promise<ProductVariant | null> {
  if (!hasDb()) return null;
  try {
    const { rows } = await sql`SELECT * FROM product_variants WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    return mapVariant(rows[0] as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!hasDb()) return [];
  try {
    const { rows } = await sql`SELECT * FROM products ORDER BY id ASC`;
    const products = rows.map((r) => mapProduct(r as Record<string, unknown>));
    return attachVariants(products);
  } catch {
    return [];
  }
}

export async function getProduct(id: number): Promise<Product | null> {
  if (!hasDb()) return null;
  try {
    const { rows } = await sql`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) return null;
    const products = await attachVariants([
      mapProduct(rows[0] as Record<string, unknown>),
    ]);
    return products[0];
  } catch {
    return null;
  }
}

// ---------- Raw product images (for /api/image + admin saves) ----------

// Fetch the STORED image values for one product — raw data URLs, not the
// public /api/image URLs that mapProduct returns. Used by the /api/image
// route to serve the binary, and by the admin update handler to keep
// images the owner did not change. Falls back to the main photo only when
// the gallery column does not exist yet (migration not run).
export async function getProductImageValues(
  id: number,
): Promise<{ image_url: string; gallery: string[] } | null> {
  if (!hasDb()) return null;
  try {
    const { rows } = await sql`
      SELECT image_url, gallery FROM products WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return {
      image_url: String(rows[0].image_url ?? ''),
      gallery: parseGallery(rows[0].gallery),
    };
  } catch {
    try {
      const { rows } = await sql`
        SELECT image_url FROM products WHERE id = ${id} LIMIT 1
      `;
      if (rows.length === 0) return null;
      return { image_url: String(rows[0].image_url ?? ''), gallery: [] };
    } catch {
      return null;
    }
  }
}

// Resolve one image value coming back from the admin form. An /api/image
// URL means "keep the stored image at that index" (the form shows stored
// photos through the route, so an untouched photo comes back as a route
// URL). Data URLs (fresh uploads) and remote URLs (pasted links) are
// stored as-is. A route URL for a different product is dropped.
export function resolveImageValue(
  value: string,
  productId: number,
  existing: { image_url: string; gallery: string[] } | null,
): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = /^\/api\/image\?product=(\d+)&i=(\d+)$/.exec(trimmed);
  if (!match) return trimmed;
  if (Number(match[1]) !== productId || !existing) return '';
  const index = Number(match[2]);
  if (index === 0) return existing.image_url;
  return existing.gallery[index - 1] ?? '';
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!hasDb()) return [];
  const q = `%${query.trim()}%`;
  try {
    const { rows } = await sql`
      SELECT * FROM products
      WHERE name ILIKE ${q} OR category ILIKE ${q} OR description ILIKE ${q}
      ORDER BY id ASC
    `;
    const products = rows.map((r) => mapProduct(r as Record<string, unknown>));
    return attachVariants(products);
  } catch {
    return [];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!hasDb()) return [];
  try {
    const { rows } = await sql`
      SELECT * FROM products WHERE category = ${category} ORDER BY id ASC
    `;
    const products = rows.map((r) => mapProduct(r as Record<string, unknown>));
    return attachVariants(products);
  } catch {
    return [];
  }
}

// ---------- Orders ----------

export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const stripped = digits.startsWith('92') ? digits.slice(2) : digits;
  return stripped.replace(/^0/, '').slice(-10);
}

export async function getOrdersWithItems(): Promise<Order[]> {
  if (!hasDb()) return [];
  try {
    const { rows } = await sql`SELECT * FROM orders ORDER BY id DESC`;
    const orders = rows.map((r) => mapOrder(r as Record<string, unknown>));
    if (orders.length === 0) return orders;
    const ids = orders.map((o) => o.id);
    const { rows: itemRows } = await sql.query(
      `SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id ASC`,
      [ids],
    );
    const byOrder = new Map<number, OrderItem[]>();
    for (const r of itemRows) {
      const item = mapOrderItem(r as Record<string, unknown>);
      const list = byOrder.get(item.order_id) ?? [];
      list.push(item);
      byOrder.set(item.order_id, list);
    }
    for (const o of orders) o.items = byOrder.get(o.id) ?? [];
    return orders;
  } catch {
    return [];
  }
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!hasDb()) return null;
  try {
    const { rows } = await sql`
      SELECT * FROM orders WHERE order_number = ${orderNumber} LIMIT 1
    `;
    if (rows.length === 0) return null;
    const order = mapOrder(rows[0] as Record<string, unknown>);
    const { rows: itemRows } = await sql`
      SELECT * FROM order_items WHERE order_id = ${order.id} ORDER BY id ASC
    `;
    order.items = itemRows.map((r) => mapOrderItem(r as Record<string, unknown>));
    return order;
  } catch {
    return null;
  }
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const all = await getOrdersWithItems();
  const wanted = normalisePhone(phone);
  if (!wanted) return [];
  return all.filter((o) => normalisePhone(o.phone) === wanted);
}
