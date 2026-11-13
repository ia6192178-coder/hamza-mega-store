import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import {
  ensureBlogSchema,
  ensureCategorySchema,
  ensureVariantSchema,
  hasDb,
} from '@/lib/db';
import { DEFAULT_SETTINGS, SEED_PRODUCTS, SEED_VARIANTS } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

// GET /api/seed — one-time setup, safe to call again (idempotent):
//  - creates the tables if they do not exist
//  - runs the variants migration (new table + columns, all IF NOT EXISTS)
//  - runs the gallery migration (gallery column, IF NOT EXISTS)
//  - runs the categories migration (categories table + the 10 original
//    categories, missing only)
//  - runs the blog migration (blog_posts table + the 3 original posts,
//    missing only)
//  - inserts default settings for keys that are missing (never overwrites)
//  - inserts the 31 sample products ONLY when the products table is empty
//    (on a fresh seed only, 2 of them get demo variants — never on an
//    existing database, so live products and orders are never touched)
export async function GET() {
  if (!hasDb()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'POSTGRES_URL is not set. Create a Postgres database in the Vercel dashboard (Storage → Create Database → Postgres) and connect it to this project, then open this page again.',
      },
      { status: 500 },
    );
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        old_price INTEGER,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        gallery TEXT NOT NULL DEFAULT '[]',
        stock INTEGER NOT NULL DEFAULT 0,
        is_new BOOLEAN NOT NULL DEFAULT FALSE,
        is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
        is_clearance BOOLEAN NOT NULL DEFAULT FALSE,
        is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
        rating NUMERIC(2,1) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        total INTEGER NOT NULL,
        delivery_fee INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Variants + gallery migration — safe on a live database: creates the
    // product_variants table and adds the new columns only if missing.
    // Existing products, variants and orders are never changed.
    await ensureVariantSchema();

    // Categories migration — creates the table (if missing) and seeds the
    // 10 original categories plus any category products already use.
    // Existing products and orders are never changed.
    await ensureCategorySchema();

    // Blog migration — creates the table (if missing) and seeds the 3
    // original posts. Existing products and orders are never changed.
    await ensureBlogSchema();

    // Default settings — only for keys that do not exist yet, so re-running
    // seed never overwrites the owner's changes (including the admin password).
    let settingsAdded = 0;
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const result = await sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO NOTHING
      `;
      settingsAdded += result.rowCount ?? 0;
    }

    // Sample products — only when the table is empty.
    const countResult = await sql`SELECT COUNT(*)::int AS count FROM products`;
    const existing = Number(countResult.rows[0]?.count ?? 0);
    let productsSeeded = 0;
    let variantsSeeded = 0;
    if (existing === 0) {
      for (const p of SEED_PRODUCTS) {
        await sql`
          INSERT INTO products
            (name, category, price, old_price, description, image_url, stock,
             is_new, is_best_seller, is_clearance, is_sold_out, rating)
          VALUES
            (${p.name}, ${p.category}, ${p.price}, ${p.old_price}, ${p.description},
             ${p.image_url}, ${p.stock}, ${p.is_new}, ${p.is_best_seller},
             ${p.is_clearance}, ${p.is_sold_out}, ${p.rating})
        `;
        productsSeeded++;
      }

      // Demo variants — fresh seed only, so the owner can see how size and
      // weight options work. Never runs on an existing database.
      for (const group of SEED_VARIANTS) {
        const found = await sql`
          SELECT id FROM products WHERE name = ${group.product_name} LIMIT 1
        `;
        if (found.rows.length === 0) continue;
        const productId = Number(found.rows[0].id);
        await sql`
          UPDATE products SET variant_label = ${group.variant_label}
          WHERE id = ${productId}
        `;
        for (let i = 0; i < group.variants.length; i++) {
          const v = group.variants[i];
          await sql`
            INSERT INTO product_variants
              (product_id, label, price, old_price, stock, sort_order)
            VALUES
              (${productId}, ${v.label}, ${v.price}, ${v.old_price}, ${v.stock}, ${i})
          `;
          variantsSeeded++;
        }
      }
    }

    const totalResult = await sql`SELECT COUNT(*)::int AS count FROM products`;
    const total = Number(totalResult.rows[0]?.count ?? 0);
    const catResult = await sql`SELECT COUNT(*)::int AS count FROM categories`;
    const categoriesTotal = Number(catResult.rows[0]?.count ?? 0);
    const blogResult = await sql`SELECT COUNT(*)::int AS count FROM blog_posts`;
    const blogPostsTotal = Number(blogResult.rows[0]?.count ?? 0);

    return NextResponse.json({
      ok: true,
      tables_created: true,
      settings_added: settingsAdded,
      products_seeded: productsSeeded,
      variants_seeded: variantsSeeded,
      products_total: total,
      categories_total: categoriesTotal,
      blog_posts_total: blogPostsTotal,
      message:
        productsSeeded > 0
          ? `Done! ${productsSeeded} sample products loaded (${variantsSeeded} demo variants). Your store is ready — open the homepage, then log in at /admin (password: hamza123) and change the password in Settings.`
          : 'Tables are ready and products already exist — nothing was changed.',
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : 'Database setup failed.',
      },
      { status: 500 },
    );
  }
}
