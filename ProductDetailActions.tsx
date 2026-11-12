'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/components/CartContext';

export default function ProductDetailActions({ product }: { product: Product }) {
  const { addItem, openDrawer } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = product.is_sold_out || product.stock <= 0;

  const handleAdd = () => {
    addItem(product, qty);
    openDrawer();
  };

  const handleBuyNow = () => {
    addItem(product, qty);
    router.push('/checkout');
  };

  return (
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
  );
}
