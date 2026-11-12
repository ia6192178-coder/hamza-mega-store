import Link from 'next/link';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES, slugifyCategory } from '@/lib/categories';
import { getProducts, getSettings } from '@/lib/db';
import type { Product } from '@/lib/types';
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
    <section className="section" id={id}>
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

export default async function HomePage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

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

  return (
    <>
      <Hero />

      <div className="page-wrap">
        <div className="promo-tiles">
          <div className="promo-tile">
            <span className="promo-tile-icon">🚚</span>
            <div>
              <h3>Free Delivery Over Rs 7,000</h3>
              <p>Free nationwide delivery on all orders above Rs 7,000.</p>
            </div>
          </div>
          <div className="promo-tile">
            <span className="promo-tile-icon">💵</span>
            <div>
              <h3>Cash on Delivery</h3>
              <p>Pay when your parcel arrives at your doorstep.</p>
            </div>
          </div>
          <div className="promo-tile">
            <span className="promo-tile-icon">↩️</span>
            <div>
              <h3>7-Day Easy Exchange</h3>
              <p>Damaged or wrong item? Exchange it within 7 days, no hassle.</p>
            </div>
          </div>
        </div>

        <section className="section" id="categories">
          <div className="section-head">
            <h2 className="section-title">Shop by Category</h2>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/category/${slugifyCategory(c)}`}
                className="cat-tile"
              >
                <img src={firstImageFor(c)} alt={c} loading="lazy" />
                <span>{c}</span>
              </Link>
            ))}
          </div>
        </section>

        {products.length === 0 ? (
          <section className="section">
            <div className="empty-state">
              <h3>No products loaded yet</h3>
              <p>
                The store database is empty. The store owner needs to visit{' '}
                <code>/api/seed</code> once on the live site to create the tables
                and load the sample products — see the README for the steps.
              </p>
            </div>
          </section>
        ) : (
          <>
            <Section
              id="new-arrivals"
              title="New Arrivals"
              products={newArrivals}
              viewAllHref="/search?q="
            />
            <Section
              id="budget"
              title="Budget — Below Rs 499"
              products={budget}
              viewAllHref="/search?q="
            />
            <Section
              id="clearance"
              title="Clearance Sale"
              products={clearance}
              viewAllHref="/search?q="
            />
            <Section
              id="best-sellers"
              title="Best Sellers"
              products={bestSellers}
              viewAllHref="/search?q="
            />
            <section className="section" id="all-products">
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
          </>
        )}

        <section className="section">
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
      </div>
    </>
  );
}
