'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Settings } from '@/lib/types';
import { formatRs } from '@/lib/types';
import { itemKey, lineName, linePrice, useCart } from '@/components/CartContext';

type PlacedOrder = {
  order_number: string;
  total: number;
  delivery_fee: number;
};

const MY_ORDERS_KEY = 'hms-my-orders';

function rememberOrder(orderNumber: string) {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderNumber)) {
      list.unshift(orderNumber);
      localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
    }
  } catch {
    // ignore storage errors
  }
}

export default function CheckoutForm({ settings }: { settings: Settings }) {
  const { items, subtotal, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const deliveryFee = Number(settings.delivery_fee || 250);
  const freeThreshold = Number(settings.free_delivery_threshold || 7000);
  const delivery = subtotal >= freeThreshold || subtotal === 0 ? 0 : deliveryFee;
  const total = subtotal + delivery;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Please enter your full name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid mobile number (e.g. 0307-1234567).');
      return;
    }
    if (!city.trim() || !address.trim()) {
      setError('Please enter your city and full delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.qty,
            // The server re-checks the variant and its price in the database.
            variant_id: i.variant ? i.variant.id : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place the order.');
      rememberOrder(data.order_number);
      setPlaced({
        order_number: data.order_number,
        total: data.total,
        delivery_fee: data.delivery_fee,
      });
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order.');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    const waText = encodeURIComponent(
      `Assalam-o-Alaikum! I just placed an order on Hamza Mega Store.\nOrder Number: ${placed.order_number}\nName: ${name}\nTotal: Rs ${placed.total.toLocaleString('en-US')} (Cash on Delivery)`,
    );
    return (
      <div className="page-wrap">
        <div className="card checkout-success">
          <h2>✅ Order Placed Successfully!</h2>
          <p>Thank you, {name}. Your order number is:</p>
          <div className="order-number-big">{placed.order_number}</div>
          <p>
            Total (Cash on Delivery):{' '}
            <strong>{formatRs(placed.total)}</strong>
            {placed.delivery_fee === 0
              ? ' — delivery is FREE on this order.'
              : ` — includes Rs ${placed.delivery_fee} delivery.`}
          </p>
          <p style={{ color: 'var(--muted)' }}>
            We will call you shortly to confirm your order. You can track it
            anytime on the My Orders page using your phone number.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 18,
            }}
          >
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-navy"
            >
              Confirm on WhatsApp
            </a>
            <Link href="/orders" className="btn-outline">
              Track My Order
            </Link>
            <Link href="/" className="btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Checkout</h1>
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>Add some products before checking out.</p>
          <Link href="/" className="btn-navy" style={{ marginTop: 12 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Checkout</h1>
      <p className="page-subtitle">Cash on Delivery — pay when your parcel arrives.</p>

      <div className="cart-layout">
        <form className="card" onSubmit={submit}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--navy)' }}>
            Delivery Details
          </h3>
          {error && <div className="form-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="co-name">Full Name *</label>
            <input
              id="co-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Muhammad Ahmed"
              autoComplete="name"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="co-phone">Mobile Number *</label>
              <input
                id="co-phone"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0307-1234567"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="form-field">
              <label htmlFor="co-city">City *</label>
              <input
                id="co-city"
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lahore"
                autoComplete="address-level2"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="co-address">Full Delivery Address *</label>
            <textarea
              id="co-address"
              className="input"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / street / area / block — full address for the courier"
              autoComplete="street-address"
            />
          </div>

          <div
            style={{
              background: '#f0f3fa',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            <strong>Payment method:</strong> Cash on Delivery (COD) — you pay the
            courier in cash when your order arrives. No advance payment needed.
          </div>

          <button
            type="submit"
            className="btn-red btn-lg btn-block"
            disabled={placing}
          >
            {placing ? 'Placing your order…' : `Place Order — ${formatRs(total)}`}
          </button>
        </form>

        <div className="card">
          <h3 style={{ margin: '0 0 12px', color: 'var(--navy)' }}>
            Order Summary
          </h3>
          {items.map((item) => (
            <div key={itemKey(item)} className="order-item-line">
              <span>
                {lineName(item)} × {item.qty}
              </span>
              <strong>{formatRs(linePrice(item) * item.qty)}</strong>
            </div>
          ))}
          <div
            className="summary-row"
            style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}
          >
            <span>Subtotal</span>
            <strong>{formatRs(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <strong>{delivery === 0 ? 'FREE' : formatRs(delivery)}</strong>
          </div>
          <div className="summary-row summary-total">
            <span>Total (COD)</span>
            <strong>{formatRs(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
