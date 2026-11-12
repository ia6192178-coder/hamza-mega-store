'use client';

import Link from 'next/link';
import type { Settings } from '@/lib/types';
import { formatRs } from '@/lib/types';
import { itemKey, lineName, linePrice, useCart } from './CartContext';

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
              {items.map((item) => (
                <div key={itemKey(item)} className="drawer-item">
                  <img src={item.product.image_url} alt={item.product.name} />
                  <div className="drawer-item-info">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="drawer-item-name"
                      onClick={closeDrawer}
                    >
                      {lineName(item)}
                    </Link>
                    <span className="drawer-item-price">
                      {formatRs(linePrice(item))}
                    </span>
                    <div className="drawer-item-row">
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
                  <span className="drawer-item-total">
                    {formatRs(linePrice(item) * item.qty)}
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
