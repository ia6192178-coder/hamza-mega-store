import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard, { Stars } from '@/components/ProductCard';
import ProductDetailActions from '@/components/ProductDetailActions';
import { slugifyCategory } from '@/lib/categories';
import { getProduct, getProductsByCategory, getSettings } from '@/lib/db';
import { productHasVariants, productSoldOut, variantBestDiscount } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [product, settings] = await Promise.all([getProduct(id), getSettings()]);
  if (!product) notFound();

  const related = (await getProductsByCategory(product.category)).filter(
    (p) => p.id !== product.id,
  );

  // Image badges use the best variant discount (or the base discount).
  const off = variantBestDiscount(product);
  const soldOut = productSoldOut(product);

  return (
    <div className="page-wrap">
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)' }}>
        <Link href="/">Home</Link> /{' '}
        <Link href={`/category/${slugifyCategory(product.category)}`}>
          {product.category}
        </Link>{' '}
        / {product.name}
      </p>

      <div className="product-detail">
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.name} />
          {off !== null && <span className="pc-badge pc-badge-off">{off}% OFF</span>}
          {soldOut && <span className="pc-soldout">SOLD OUT</span>}
        </div>

        <div className="product-detail-info">
          <span className="pc-cat">{product.category}</span>
          <h1>{product.name}</h1>
          <Stars rating={product.rating} />
          {productHasVariants(product) && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              Available in {product.variants!.length}{' '}
              {product.variant_label
                ? product.variant_label.toLowerCase()
                : 'option'}
              {product.variants!.length > 1 ? 's' : ''} — select one below.
            </p>
          )}

          {/* Price, description, stock, variant selector and cart buttons —
              all live inside ProductDetailActions so they follow the
              selected variant. */}
          <ProductDetailActions product={product} />

          <div className="detail-meta">
            <p>
              🚚 Delivery: <strong>Rs {settings.delivery_fee}</strong> — free on
              orders over{' '}
              <strong>
                Rs{' '}
                {Number(settings.free_delivery_threshold).toLocaleString('en-US')}
              </strong>
            </p>
            <p>
              💵 Payment: <strong>Cash on Delivery</strong> — pay at your
              doorstep.
            </p>
            <p>
              ↩️ <strong>7-day easy exchange</strong> on damaged or wrong items.
            </p>
            <p>
              📞 Questions? Call <strong>{settings.phone}</strong> or{' '}
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--red)', fontWeight: 700 }}
              >
                WhatsApp us
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Related Products</h2>
            <Link href={`/category/${slugifyCategory(product.category)}`}>
              View All →
            </Link>
          </div>
          <div className="product-grid">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
