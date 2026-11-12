'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Product, ProductVariant } from '@/lib/types';
import {
  discountPercent,
  formatRs,
  productHasVariants,
  variantDiscount,
} from '@/lib/types';
import { useCart } from '@/components/CartContext';

// The whole purchase block on the product page: price, description, stock,
// variant selector (when the product has variants) and Add to Cart /
// Buy Now. The price, discount and stock all follow the selected variant.
// For simple products this renders exactly as before.
export default function ProductDetailActions({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const router = useRouter();
  const hasVariants = productHasVariants(product);
  const variants = useMemo(
    () => (hasVariants ? (product.variants as ProductVariant[]) : []),
    [hasVariants, product.variants],
  );

  // Default to the first variant that is in stock, else the first variant.
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (variants.length === 0) return null;
    return (variants.find((v) => v.stock > 0) ?? variants[0]).id;
  });
  const [qty, setQty] = useState(1);

  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0] ?? null;

  const price = selected ? selected.price : product.price;
  const oldPrice = selected ? selected.old_price : product.old_price;
  const stock = selected ? selected.stock : product.stock;
  const off = selected ? variantDiscount(selected) : discountPercent(product);
  const soldOut =
    product.is_sold_out || stock <= 0 || (hasVariants && !selected);

  const handleAdd = () => {
    if (soldOut) return;
    addItem(product, qty, selected);
    openDrawer();
  };

  const handleBuyNow = () => {
    if (soldOut) return;
    addItem(product, qty, selected);
    router.push('/checkout');
  };

  return (
    <>
      <div className="detail-price-row">
        <span className="detail-price">{formatRs(price)}</span>
        {oldPrice && oldPrice > price && (
          <span className="detail-old">{formatRs(oldPrice)}</span>
        )}
        {off !== null && <span className="detail-off">Save {off}%</span>}
      </div>
      <p className="detail-desc">{product.description}</p>
      <p className={`detail-stock ${soldOut ? 'out' : 'in'}`}>
        {soldOut
          ? 'Out of stock'
          : stock <= 5
            ? `Only ${stock} left in stock — order soon`
            : 'In stock'}
      </p>

      {hasVariants && (
        <div className="variant-selector">
          <span className="variant-label">
            {product.variant_label ?? 'Option'}:{' '}
            <strong>{selected ? selected.label : '—'}</strong>
          </span>
          <div className="variant-options">
            {variants.map((v) => {
              const out = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`variant-btn${selected?.id === v.id ? ' selected' : ''}${out ? ' out' : ''}`}
                  onClick={() => setSelectedId(v.id)}
                  disabled={out}
                  aria-pressed={selected?.id === v.id}
                >
                  {v.label}
                  {out && ' — Out'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="detail-actions">
        <div className="qty-controls" style={{ height: 42 }}>
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            style={{ width: 40, height: 40 }}
          >
            −
          </button>
          <span style={{ minWidth: 40, fontSize: 16 }}>{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            style={{ width: 40, height: 40 }}
          >
            +
          </button>
        </div>
        <button className="btn-navy btn-lg" onClick={handleAdd} disabled={soldOut}>
          ADD TO CART
        </button>
        <button className="btn-red btn-lg" onClick={handleBuyNow} disabled={soldOut}>
          BUY NOW
        </button>
      </div>
    </>
  );
}
