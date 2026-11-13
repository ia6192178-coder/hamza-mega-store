import { sql } from '@vercel/postgres';
import {
  BlogInputError,
  makeUniqueSlug,
  SEED_BLOG_POSTS,
  slugifyBlogTitle,
  type BlogPostInput,
} from './blog';
import {
  CATEGORIES,
  CategoryInputError,
  slugifyCategory,
  validateCategoryName,
} from './categories';
import { DEFAULT_SETTINGS } from './seed-data';
import type {
  BlogPost,
  CategoryWithCount,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Settings,
} from './types';

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

// ---------- Categories (v4) ----------
// Categories live in their own table so the owner can add, rename and
// delete them from the Admin Panel. Same idempotent pattern as the
// variants/gallery migration: CREATE TABLE IF NOT EXISTS, then seed the 10
// original categories (exactly once, guarded by a `categories_seeded`
// marker so a deleted original category stays deleted) and any category
// already used by a product (heals drift from before the table existed).
// Safe to run any time — re-running changes nothing. The /api/seed route
// runs it, and the admin category APIs + Categories page call it lazily so
// the feature works even if the owner forgets to visit /api/seed after the
// update.
const CATEGORY_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

let categorySchemaPromise: Promise<void> | null = null;

export function ensureCategorySchema(): Promise<void> {
  if (!hasDb()) return Promise.resolve();
  if (!categorySchemaPromise) {
    categorySchemaPromise = (async () => {
      for (const statement of CATEGORY_SCHEMA_SQL) {
        await sql.query(statement);
      }
      // Seed the 10 original categories exactly once. A
      // `categories_seeded` marker in the settings table records that the
      // seed has run — without it, plain "insert missing" seeding would
      // resurrect an original category the owner deleted, on every fresh
      // serverless instance. If the settings table is missing (fresh
      // database, seed not run yet), fall back to plain inserts — the
      // table is new, so nothing can be resurrected, and the marker is
      // set on the next run.
      let alreadySeeded = false;
      try {
        const marker = await sql`
          SELECT value FROM settings WHERE key = 'categories_seeded' LIMIT 1
        `;
        alreadySeeded = marker.rows.length > 0;
      } catch {
        // Settings table missing — fall through to plain inserts.
      }
      if (!alreadySeeded) {
        for (const name of CATEGORIES) {
          await sql`
            INSERT INTO categories (name) VALUES (${name})
            ON CONFLICT (name) DO NOTHING
          `;
        }
        try {
          await sql`
            INSERT INTO settings (key, value) VALUES ('categories_seeded', '1')
            ON CONFLICT (key) DO NOTHING
          `;
        } catch {
          // Settings table missing — the marker is set on the next run.
        }
      }
      // Any category a product already uses, but the table does not have
      // yet (case-insensitive — "Footwear" and "footwear" are one
      // category). Best-effort: if the products table does not exist yet
      // (fresh database, seed not run), this is skipped silently.
      try {
        await sql`
          INSERT INTO categories (name)
          SELECT DISTINCT ON (LOWER(category)) category FROM products p
          WHERE NOT EXISTS (
            SELECT 1 FROM categories c WHERE LOWER(c.name) = LOWER(p.category)
          )
          ON CONFLICT (name) DO NOTHING
        `;
      } catch {
        // Products table missing — nothing to heal.
      }
    })().catch((err) => {
      // Allow a later call to retry.
      categorySchemaPromise = null;
      throw err;
    });
  }
  return categorySchemaPromise;
}

// Category names for the storefront and the admin product form. Falls back
// to the built-in list when the database or the table is missing — or the
// table is empty (migration not run yet) — so nothing ever breaks.
export async function getCategories(): Promise<string[]> {
  if (!hasDb()) return [...CATEGORIES];
  try {
    const { rows } = await sql`SELECT name FROM categories ORDER BY id ASC`;
    if (rows.length === 0) return [...CATEGORIES];
    return rows.map((r) => String(r.name));
  } catch {
    return [...CATEGORIES];
  }
}

// How many products use each category (one grouped query). Safe without a
// database or a products table — returns an empty map.
async function getProductCountsByCategory(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!hasDb()) return counts;
  try {
    const { rows } = await sql`
      SELECT category, COUNT(*)::int AS count FROM products GROUP BY category
    `;
    for (const r of rows) {
      counts.set(String(r.category), Number(r.count));
    }
  } catch {
    // Products table missing — counts stay empty.
  }
  return counts;
}

// Categories with slugs + product counts, for the Admin Panel and the
// public /api/categories feed. Same fallback as getCategories().
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const counts = await getProductCountsByCategory();
  const fallback = (): CategoryWithCount[] =>
    CATEGORIES.map((name) => ({
      id: 0,
      name,
      slug: slugifyCategory(name),
      count: counts.get(name) ?? 0,
    }));
  if (!hasDb()) return fallback();
  try {
    const { rows } = await sql`SELECT id, name FROM categories ORDER BY id ASC`;
    if (rows.length === 0) return fallback();
    return rows.map((r) => {
      const name = String(r.name);
      return {
        id: Number(r.id),
        name,
        slug: slugifyCategory(name),
        count: counts.get(name) ?? 0,
      };
    });
  } catch {
    return fallback();
  }
}

// Two different names must never share a page URL (e.g. "Kids Toys" and
// "Kids-Toys" both become /category/kids-toys). Throws CategoryInputError
// when the slug is already taken by another category.
async function assertSlugFree(slug: string, excludeId?: number): Promise<void> {
  const { rows } = await sql`SELECT id, name FROM categories`;
  for (const r of rows) {
    if (excludeId !== undefined && Number(r.id) === excludeId) continue;
    if (slugifyCategory(String(r.name)) === slug) {
      throw new CategoryInputError(
        `"${String(r.name)}" already uses that page address — please choose a different name.`,
      );
    }
  }
}

// Create a category. If a category with the same name already exists
// (case-insensitive), the existing one is returned instead — so the
// product form's "Create New" never fails on a duplicate, it just uses it.
export async function createCategory(
  rawName: string,
): Promise<{ id: number; name: string; existed: boolean }> {
  const { name, error } = validateCategoryName(rawName);
  if (!name) throw new CategoryInputError(error ?? 'Invalid category name.');
  await ensureCategorySchema();
  const found = await sql`
    SELECT id, name FROM categories WHERE LOWER(name) = LOWER(${name}) LIMIT 1
  `;
  if (found.rows.length > 0) {
    return {
      id: Number(found.rows[0].id),
      name: String(found.rows[0].name),
      existed: true,
    };
  }
  await assertSlugFree(slugifyCategory(name));
  const { rows } = await sql`
    INSERT INTO categories (name) VALUES (${name}) RETURNING id
  `;
  return { id: Number(rows[0].id), name, existed: false };
}

// Rename a category. Products store the category as plain text, so they
// are moved to the new name in the same step — otherwise the renamed
// category would look empty and the old name would linger on products.
export async function renameCategory(
  id: number,
  rawName: string,
): Promise<{ id: number; name: string }> {
  const { name, error } = validateCategoryName(rawName);
  if (!name) throw new CategoryInputError(error ?? 'Invalid category name.');
  await ensureCategorySchema();
  const current = await sql`
    SELECT id, name FROM categories WHERE id = ${id} LIMIT 1
  `;
  if (current.rows.length === 0) {
    throw new CategoryInputError('Category not found.', 404);
  }
  const oldName = String(current.rows[0].name);
  if (oldName === name) return { id, name };
  const dup = await sql`
    SELECT id FROM categories
    WHERE LOWER(name) = LOWER(${name}) AND id <> ${id} LIMIT 1
  `;
  if (dup.rows.length > 0) {
    throw new CategoryInputError(`A category named "${name}" already exists.`);
  }
  await assertSlugFree(slugifyCategory(name), id);
  await sql`UPDATE categories SET name = ${name} WHERE id = ${id}`;
  await sql`UPDATE products SET category = ${name} WHERE category = ${oldName}`;
  return { id, name };
}

// Delete a category — only when no product uses it. The owner must move
// those products to another category first (or delete them).
export async function deleteCategory(id: number): Promise<void> {
  await ensureCategorySchema();
  const current = await sql`
    SELECT id, name FROM categories WHERE id = ${id} LIMIT 1
  `;
  if (current.rows.length === 0) {
    throw new CategoryInputError('Category not found.', 404);
  }
  const name = String(current.rows[0].name);
  const count = await sql`
    SELECT COUNT(*)::int AS count FROM products WHERE category = ${name}
  `;
  const used = Number(count.rows[0]?.count ?? 0);
  if (used > 0) {
    throw new CategoryInputError(
      `Cannot delete "${name}" — ${used} product${used === 1 ? '' : 's'} still use${used === 1 ? 's' : ''} it. Move those products to another category first.`,
      409,
    );
  }
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

// Make sure a category name exists in the table (called on every product
// save, so a category can never drift out of the list). Case-insensitive:
// "footwear" does not create a second row next to "Footwear".
export async function ensureCategoryExists(name: string): Promise<void> {
  const clean = String(name ?? '').trim();
  if (!clean) return;
  await ensureCategorySchema();
  const found = await sql`
    SELECT id FROM categories WHERE LOWER(name) = LOWER(${clean}) LIMIT 1
  `;
  if (found.rows.length === 0) {
    await sql`
      INSERT INTO categories (name) VALUES (${clean})
      ON CONFLICT (name) DO NOTHING
    `;
  }
}

// ---------- Blog posts (v5) ----------
// Posts live in their own table so the owner can add, edit and delete
// them from the Admin Panel. Same idempotent pattern as the categories
// migration: CREATE TABLE IF NOT EXISTS, then seed the 3 original posts
// (missing only, by slug) — exactly once, guarded by a `blog_seeded`
// marker so a deleted seed post stays deleted. Safe to run any time —
// re-running changes nothing. The /api/seed route runs it, and the admin
// blog APIs + Blog page call it lazily so the feature works even if the
// owner forgets to visit /api/seed after the update.
const BLOG_SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

let blogSchemaPromise: Promise<void> | null = null;

export function ensureBlogSchema(): Promise<void> {
  if (!hasDb()) return Promise.resolve();
  if (!blogSchemaPromise) {
    blogSchemaPromise = (async () => {
      for (const statement of BLOG_SCHEMA_SQL) {
        await sql.query(statement);
      }
      // Seed the 3 original posts exactly once. A `blog_seeded` marker in
      // the settings table records that the seed has run — without it,
      // plain "insert missing" seeding would resurrect a seed post the
      // owner deleted, on every fresh serverless instance. If the settings
      // table is missing (fresh database, seed not run yet), fall back to
      // plain inserts — the table is new, so nothing can be resurrected,
      // and the marker is set on the next run.
      let alreadySeeded = false;
      try {
        const marker = await sql`
          SELECT value FROM settings WHERE key = 'blog_seeded' LIMIT 1
        `;
        alreadySeeded = marker.rows.length > 0;
      } catch {
        // Settings table missing — fall through to plain inserts.
      }
      if (!alreadySeeded) {
        for (const post of SEED_BLOG_POSTS) {
          await sql`
            INSERT INTO blog_posts (title, slug, excerpt, body, image_url, created_at)
            VALUES (${post.title}, ${post.slug}, ${post.excerpt}, ${post.body}, ${post.image_url}, ${post.created_at})
            ON CONFLICT (slug) DO NOTHING
          `;
        }
        try {
          await sql`
            INSERT INTO settings (key, value) VALUES ('blog_seeded', '1')
            ON CONFLICT (key) DO NOTHING
          `;
        } catch {
          // Settings table missing — the marker is set on the next run.
        }
      }
    })().catch((err) => {
      // Allow a later call to retry.
      blogSchemaPromise = null;
      throw err;
    });
  }
  return blogSchemaPromise;
}

// Postgres returns TIMESTAMPTZ as a Date — normalise every row before
// use, and rewrite an uploaded (data URL) photo to the light /api/image
// route URL so page data never carries base64 images.
export function mapBlogPost(row: Record<string, unknown>): BlogPost {
  const id = Number(row.id);
  const rawImage = String(row.image_url ?? '');
  return {
    id,
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    excerpt: String(row.excerpt ?? ''),
    body: String(row.body ?? ''),
    image_url: rawImage.startsWith('data:')
      ? `/api/image?post=${id}`
      : rawImage,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

// The 3 original posts, as BlogPost objects with id 0 — shown when the
// database (or the blog_posts table) is not there yet, so the blog page
// never breaks. Id 0 also means "not editable" in the Admin Panel.
function fallbackBlogPosts(): BlogPost[] {
  return [...SEED_BLOG_POSTS]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((p) => ({
      id: 0,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body,
      image_url: p.image_url,
      created_at: p.created_at,
    }));
}

// All posts, newest first. Falls back to the 3 originals when the
// database or the table is missing — but NOT when the table exists and is
// empty (the owner deleted every post on purpose, so the blog stays empty).
export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!hasDb()) return fallbackBlogPosts();
  try {
    const { rows } = await sql`
      SELECT * FROM blog_posts ORDER BY created_at DESC, id DESC
    `;
    return rows.map((r) => mapBlogPost(r as Record<string, unknown>));
  } catch {
    return fallbackBlogPosts();
  }
}

// One post by its page address. Falls back to the originals only when the
// table is missing (migration not run yet) — a post that was deleted from
// a live table stays deleted.
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  if (!hasDb()) {
    return fallbackBlogPosts().find((p) => p.slug === slug) ?? null;
  }
  try {
    const { rows } = await sql`
      SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return mapBlogPost(rows[0] as Record<string, unknown>);
  } catch {
    return fallbackBlogPosts().find((p) => p.slug === slug) ?? null;
  }
}

// Unique page address for a post title: the base slug, or base-2, base-3,
// … when taken. excludeId skips one post, so re-saving an unchanged title
// keeps its slug.
async function uniquePostSlug(
  base: string,
  excludeId?: number,
): Promise<string> {
  const { rows } = await sql`SELECT id, slug FROM blog_posts`;
  const existing = rows
    .filter((r) => excludeId === undefined || Number(r.id) !== excludeId)
    .map((r) => String(r.slug));
  return makeUniqueSlug(base, existing);
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPost> {
  await ensureBlogSchema();
  const slug = await uniquePostSlug(slugifyBlogTitle(input.title));
  const { rows } = await sql`
    INSERT INTO blog_posts (title, slug, excerpt, body, image_url)
    VALUES (${input.title}, ${slug}, ${input.excerpt}, ${input.body}, ${input.image_url})
    RETURNING *
  `;
  return mapBlogPost(rows[0] as Record<string, unknown>);
}

export async function updateBlogPost(
  id: number,
  input: BlogPostInput,
): Promise<BlogPost> {
  await ensureBlogSchema();
  const current = await sql`
    SELECT id FROM blog_posts WHERE id = ${id} LIMIT 1
  `;
  if (current.rows.length === 0) {
    throw new BlogInputError('Post not found.', 404);
  }
  // The page address follows the title — re-saving an unchanged title
  // keeps the same slug (its own slug is excluded from the clash check).
  const slug = await uniquePostSlug(slugifyBlogTitle(input.title), id);
  const { rows } = await sql`
    UPDATE blog_posts SET
      title = ${input.title},
      slug = ${slug},
      excerpt = ${input.excerpt},
      body = ${input.body},
      image_url = ${input.image_url}
    WHERE id = ${id}
    RETURNING *
  `;
  return mapBlogPost(rows[0] as Record<string, unknown>);
}

export async function deleteBlogPost(id: number): Promise<void> {
  await ensureBlogSchema();
  const { rowCount } = await sql`DELETE FROM blog_posts WHERE id = ${id}`;
  if ((rowCount ?? 0) === 0) {
    throw new BlogInputError('Post not found.', 404);
  }
}

// Fetch the STORED photo value for one post — the raw data URL, not the
// public /api/image URL that mapBlogPost returns. Used by the /api/image
// route to serve the binary, and by the admin update handler to keep a
// photo the owner did not change.
export async function getBlogPostImageValue(
  id: number,
): Promise<string | null> {
  if (!hasDb()) return null;
  try {
    const { rows } = await sql`
      SELECT image_url FROM blog_posts WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return String(rows[0].image_url ?? '');
  } catch {
    return null;
  }
}

// Resolve one photo value coming back from the admin form. An /api/image
// URL means "keep the stored photo" (the form shows stored photos through
// the route, so an untouched photo comes back as a route URL). Data URLs
// (fresh uploads) and remote URLs (pasted links) are stored as-is. A
// route URL for a different post is dropped.
export function resolveBlogImageValue(
  value: string,
  postId: number,
  existing: string | null,
): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = /^\/api\/image\?post=(\d+)$/.exec(trimmed);
  if (!match) return trimmed;
  if (Number(match[1]) !== postId || existing === null) return '';
  return existing;
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
