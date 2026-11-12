'use client';

import Link from 'next/link';
import type { Settings } from '@/lib/types';
import { formatRs } from '@/lib/types';
import { useCart } from './CartContext';

export default function CartDrawer({ settings }: { settings: Settings }) {
  const { items, subtotal, count, drawerOpen, closeDrawer, updateQty, removeItem } =
    useCart();

  const deliveryFee = Number(settings.delivery_fee || 250);
  const freeThreshold = Number(settings.free_delivery_threshold || 7000);
  const delivery = subtotal >= freeThreshold || subtotal === 0 ? 0 : deliveryFee;

  if (!drawerOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={closeDrawer} />
      <aside className="drawer" aria-label="Shopping cart">
        <div className="drawer-head">
          <h2>
            Your Cart {count > 0 && <span>({count} items)</span>}
          </h2>
          <button className="drawer-close" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p>Your cart is empty.</p>
            <button className="btn-navy" onClick={closeDrawer}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {items.map(({ product, qty }) => (
                <div key={product.id} className="drawer-item">
                  <img src={product.image_url} alt={product.name} />
                  <div className="drawer-item-info">
                    <Link
                      href={`/product/${product.id}`}
                      className="drawer-item-name"
                      onClick={closeDrawer}
                    >
                      {product.name}
                    </Link>
                    <span className="drawer-item-price">
                      {formatRs(product.price)}
                    </span>
                    <div className="drawer-item-row">
                      <div className="qty-controls">
                        <button
                          onClick={() => updateQty(product.id, qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          onClick={() => updateQty(product.id, qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="drawer-remove"
                        onClick={() => removeItem(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="drawer-item-total">
                    {formatRs(product.price * qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="drawer-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatRs(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <strong>
                  {delivery === 0 ? 'FREE' : formatRs(delivery)}
                </strong>
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
              <Link
                href="/cart"
                className="btn-outline btn-block"
                onClick={closeDrawer}
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                className="btn-red btn-block"
                onClick={closeDrawer}
              >
                Checkout (Cash on Delivery)
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
