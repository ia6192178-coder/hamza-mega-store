'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { discountPercent, formatRs } from '@/lib/types';
import { useCart } from './CartContext';

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {'☆'.repeat(5 - full)}
      <span className="rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const router = useRouter();
  const off = discountPercent(product);
  const soldOut = product.is_sold_out || product.stock <= 0;

  const handleAdd = () => {
    addItem(product);
    openDrawer();
  };

  const handleBuyNow = () => {
    addItem(product);
    router.push('/checkout');
  };

  return (
    <article className="product-card">
      <Link href={`/product/${product.id}`} className="pc-image-wrap">
        <img
          src={product.image_url}
          alt={product.name}
          className="pc-image"
          loading="lazy"
        />
        {off !== null && <span className="pc-badge pc-badge-off">{off}% OFF</span>}
        {product.is_new && !soldOut && (
          <span className="pc-badge pc-badge-new">NEW</span>
        )}
        {soldOut && <span className="pc-soldout">SOLD OUT</span>}
      </Link>

      <div className="pc-body">
        <span className="pc-cat">{product.category}</span>
        <Link href={`/product/${product.id}`} className="pc-name">
          {product.name}
        </Link>
        <Stars rating={product.rating} />
        <div className="pc-price-row">
          <span className="pc-price">{formatRs(product.price)}</span>
          {product.old_price && product.old_price > product.price && (
            <span className="pc-old">{formatRs(product.old_price)}</span>
          )}
        </div>
        <div className="pc-actions">
          <button
            className="btn-navy"
            onClick={handleAdd}
            disabled={soldOut}
          >
            ADD TO CART
          </button>
          <button
            className="btn-red"
            onClick={handleBuyNow}
            disabled={soldOut}
          >
            BUY NOW
          </button>
        </div>
      </div>
    </article>
  );
}
