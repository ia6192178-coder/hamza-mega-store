'use client';

import Link from 'next/link';
import type { Settings } from '@/lib/types';
import { formatRs } from '@/lib/types';
import { itemKey, lineName, linePrice, useCart } from '@/components/CartContext';

export default function CartPageClient({ settings }: { settings: Settings }) {
  const { items, subtotal, updateQty, removeItem, clearCart } = useCart();

  const deliveryFee = Number(settings.delivery_fee || 250);
  const freeThreshold = Number(settings.free_delivery_threshold || 7000);
  const delivery = subtotal >= freeThreshold || subtotal === 0 ? 0 : deliveryFee;

  if (items.length === 0) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Your Cart</h1>
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>Add some products and come back here to check out.</p>
          <Link href="/" className="btn-navy" style={{ marginTop: 12 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Your Cart</h1>
      <p className="page-subtitle">{items.length} item(s) in your cart</p>

      <div className="cart-layout">
        <div className="card">
          {items.map((item) => (
            <div key={itemKey(item)} className="cart-table-item">
              <img src={item.product.image_url} alt={item.product.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/product/${item.product.id}`}
                  style={{ fontWeight: 700, color: 'var(--navy)' }}
                >
                  {lineName(item)}
                </Link>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {formatRs(linePrice(item))} each
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="qty-controls">
                    <button
                      onClick={() => updateQty(itemKey(item), item.qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      onClick={() => updateQty(itemKey(item), item.qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="drawer-remove"
                    onClick={() => removeItem(itemKey(item))}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <strong style={{ color: 'var(--red)', whiteSpace: 'nowrap' }}>
                {formatRs(linePrice(item) * item.qty)}
              </strong>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/" className="btn-outline">
              Continue Shopping
            </Link>
            <button className="btn-danger" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 12px', color: 'var(--navy)' }}>
            Order Summary
          </h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatRs(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>{delivery === 0 ? 'FREE' : formatRs(delivery)}</strong>
          </div>
          {delivery > 0 && (
            <p className="summary-note">
              Add {formatRs(freeThreshold - subtotal)} more for FREE delivery.
            </p>
          )}
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatRs(subtotal + delivery)}</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Payment: Cash on Delivery — pay when your parcel arrives.
          </p>
          <Link href="/checkout" className="btn-red btn-block">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
