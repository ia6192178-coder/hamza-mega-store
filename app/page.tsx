import Link from 'next/link';
import { Fragment } from 'react';
import DesignBlockView, { blockIsInWrap } from '@/components/DesignBlockView';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import { BUILTIN_SECTIONS, publicHeroSlides } from '@/lib/design';
import {
  getCategoriesWithCounts,
  getDesign,
  getDesignBlocks,
  getProducts,
  getSettings,
} from '@/lib/db';
import type { Product, Settings } from '@/lib/types';
import { productMinPrice } from '@/lib/types';

export const dynamic = 'force-dynamic';

function Section({
  id,
  title,
  products,
  viewAllHref,
}: {
  id: string;
  title: string;
  products: Product[];
  viewAllHref: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className="section" id={id} data-reveal>
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        <Link href={viewAllHref}>View All →</Link>
      </div>
      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="section" data-reveal>
      <div className="empty-state">
        <h3>No products loaded yet</h3>
        <p>
          The store database is empty. The store owner needs to visit{' '}
          <code>/api/seed</code> once on the live site to create the tables
          and load the sample products — see the README for the steps.
        </p>
      </div>
    </section>
  );
}

function PromoTiles() {
  return (
    <div className="promo-tiles">
      <div className="promo-tile" data-reveal>
        <span className="promo-tile-icon">🚚</span>
        <div>
          <h3>Free Delivery Over Rs 7,000</h3>
          <p>Free nationwide delivery on all orders above Rs 7,000.</p>
        </div>
      </div>
      <div className="promo-tile" data-reveal>
        <span className="promo-tile-icon">💵</span>
        <div>
          <h3>Cash on Delivery</h3>
          <p>Pay when your parcel arrives at your doorstep.</p>
        </div>
      </div>
      <div className="promo-tile" data-reveal>
        <span className="promo-tile-icon">↩️</span>
        <div>
          <h3>7-Day Easy Exchange</h3>
          <p>Damaged or wrong item? Exchange it within 7 days, no hassle.</p>
        </div>
      </div>
    </div>
  );
}

function WhyCard({ settings }: { settings: Settings }) {
  return (
    <section className="section" data-reveal>
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 8 }}>
          Why shop at {settings.store_name}?
        </h2>
        <p style={{ color: '#37415a', lineHeight: 1.7, margin: 0 }}>
          We bring quality products from trusted suppliers straight to your
          door — at prices that make sense. Every order is packed with care
          and delivered with Cash on Delivery across Pakistan. Questions?
          Call us at <strong>{settings.phone}</strong> or message us on{' '}
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--red)', fontWeight: 700 }}
          >
            WhatsApp
          </a>
          .
        </p>
      </div>
    </section>
  );
}

// v6.3: the home page renders from the Design layout (Admin → Design →
// Home Page Layout) — built-in sections and custom blocks, in the order
// the owner chose, skipping anything hidden. With no saved layout the
// built-in default order is used, so the page looks exactly as before.
export default async function HomePage() {
  const [products, settings, categories, blocks] = await Promise.all([
    getProducts(),
    getSettings(),
    getCategoriesWithCounts(),
    getDesignBlocks(),
  ]);
  const design = await getDesign(blocks.map((b) => b.id));

  const newArrivals = products.filter((p) => p.is_new);
  const budget = products.filter((p) => productMinPrice(p) < 499);
  const clearance = products.filter((p) => p.is_clearance);
  const bestSellers = products.filter((p) => p.is_best_seller);

  const firstImageFor = (category: string): string => {
    const found = products.find((p) => p.category === category);
    return (
      found?.image_url ??
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'
    );
  };

  // Hero slide photos: uploaded photos are stored as base64 data URLs —
  // serve them through the light /api/image route, never inline in the HTML.
  const heroSlides = publicHeroSlides(design.hero).slides;

  const productSections: Record<string, React.ReactNode> = {
    'new-arrivals': (
      <Section
        id="new-arrivals"
        title="New Arrivals"
        products={newArrivals}
        viewAllHref="/search?q="
      />
    ),
    budget: (
      <Section
        id="budget"
        title="Budget — Below Rs 499"
        products={budget}
        viewAllHref="/search?q="
      />
    ),
    clearance: (
      <Section
        id="clearance"
        title="Clearance Sale"
        products={clearance}
        viewAllHref="/search?q="
      />
    ),
    'best-sellers': (
      <Section
        id="best-sellers"
        title="Best Sellers"
        products={bestSellers}
        viewAllHref="/search?q="
      />
    ),
    'all-products': (
      <section className="section" id="all-products" data-reveal>
        <div className="section-head">
          <h2 className="section-title">All Products</h2>
          <span>{products.length} products</span>
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    ),
  };

  const categoriesSection = (
    <section className="section" id="categories" data-reveal>
      <div className="section-head">
        <h2 className="section-title">Shop by Category</h2>
      </div>
      <div className="cat-grid">
        {categories.map((c) => (
          <Link
            key={c.id || c.name}
            href={`/category/${c.slug}`}
            className="cat-tile"
            data-reveal
          >
            {/* v6.2: a category's own photo (set in the Admin Panel) wins;
                otherwise the tile shows the first product's photo. */}
            <img
              src={c.image_url || firstImageFor(c.name)}
              alt={c.name}
              loading="lazy"
            />
            <span>{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );

  // Build the ordered list of home page items: full-width items (hero,
  // banner/promo blocks) render outside the page-wrap; everything else
  // renders inside it.
  type HomeItem = { full: boolean; key: string; node: React.ReactNode };
  const items: HomeItem[] = [];
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  let emptyStateRendered = false;

  for (const item of design.layout) {
    if (item.kind === 'section') {
      if (!item.visible) continue;
      if (item.key === 'hero') {
        if (!design.hero.visible) continue;
        items.push({ full: true, key: 'hero', node: <Hero slides={heroSlides} /> });
        continue;
      }
      if (item.key === 'promo') {
        items.push({ full: false, key: 'promo', node: <PromoTiles /> });
        continue;
      }
      if (item.key === 'categories') {
        items.push({ full: false, key: 'categories', node: categoriesSection });
        continue;
      }
      if (item.key === 'why') {
        items.push({ full: false, key: 'why', node: <WhyCard settings={settings} /> });
        continue;
      }
      // Product sections — when the store has no products yet, the
      // empty-state hint renders once, at the first product section.
      const section = BUILTIN_SECTIONS.find((s) => s.key === item.key);
      if (section?.product) {
        if (products.length === 0) {
          if (!emptyStateRendered) {
            emptyStateRendered = true;
            items.push({ full: false, key: 'empty', node: <EmptyState /> });
          }
          continue;
        }
        const node = productSections[item.key];
        if (node) {
          items.push({ full: false, key: item.key, node });
        }
      }
      // Unknown section keys are skipped safely.
    } else {
      const block = blockById.get(item.id);
      if (!block || !block.visible) continue;
      items.push({
        full: !blockIsInWrap(block),
        key: `block-${block.id}`,
        node: <DesignBlockView block={block} />,
      });
    }
  }

  // No products and no visible product section in the layout: still show
  // the empty-state hint at the end, so the owner knows to run /api/seed.
  if (products.length === 0 && !emptyStateRendered) {
    items.push({ full: false, key: 'empty', node: <EmptyState /> });
  }

  // Group consecutive in-wrap items into one .page-wrap div (so spacing
  // matches the original single-wrap layout); full-width items render
  // on their own between wraps.
  const nodes: React.ReactNode[] = [];
  let wrap: React.ReactNode[] = [];
  const flushWrap = () => {
    if (wrap.length === 0) return;
    nodes.push(
      <div className="page-wrap" key={`wrap-${nodes.length}`}>
        {wrap}
      </div>,
    );
    wrap = [];
  };
  for (const item of items) {
    if (item.full) {
      flushWrap();
      nodes.push(<Fragment key={item.key}>{item.node}</Fragment>);
    } else {
      wrap.push(<Fragment key={item.key}>{item.node}</Fragment>);
    }
  }
  flushWrap();

  return <>{nodes}</>;
}
