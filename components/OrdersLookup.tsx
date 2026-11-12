'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/lib/types';
import { formatRs } from '@/lib/types';

const MY_ORDERS_KEY = 'hms-my-orders';

export function OrderCard({ order }: { order: Order }) {
  return (
    <div className="order-card">
      <div className="order-card-head">
        <strong>{order.order_number}</strong>
        <span className={`status-badge status-${order.status}`}>{order.status}</span>
      </div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>
        {order.customer_name} • {order.phone} • {order.city}
        <br />
        {new Date(order.created_at).toLocaleString('en-PK', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </div>
      {(order.items ?? []).map((item) => (
        <div key={item.id} className="order-item-line">
          <span>
            {item.product_name} × {item.quantity}
          </span>
          <strong>{formatRs(item.price * item.quantity)}</strong>
        </div>
      ))}
      <div
        className="summary-row"
        style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}
      >
        <span>
          Total (incl. {order.delivery_fee === 0 ? 'FREE' : formatRs(order.delivery_fee)} delivery)
        </span>
        <strong>{formatRs(order.total)}</strong>
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
        Delivery address: {order.address}
      </div>
    </div>
  );
}

export default function OrdersLookup() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [deviceOrders, setDeviceOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Orders placed on this device (saved at checkout).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(MY_ORDERS_KEY);
        const numbers: string[] = raw ? JSON.parse(raw) : [];
        if (numbers.length === 0) return;
        const found: Order[] = [];
        for (const n of numbers.slice(0, 10)) {
          try {
            const res = await fetch(
              `/api/orders?number=${encodeURIComponent(n)}`,
            );
            const data = await res.json();
            if (res.ok && data.order) found.push(data.order as Order);
          } catch {
            // skip one failed lookup
          }
        }
        if (!cancelled) setDeviceOrders(found);
      } catch {
        // ignore storage errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSearched(false);
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed.');
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <h1 className="page-title">My Orders</h1>
      <p className="page-subtitle">
        Enter the mobile number you used at checkout to see your orders.
      </p>

      <form
        className="card"
        onSubmit={search}
        style={{ maxWidth: 520, marginBottom: 24 }}
      >
        {error && <div className="form-error">{error}</div>}
        <div className="form-field">
          <label htmlFor="lookup-phone">Mobile Number</label>
          <input
            id="lookup-phone"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0307-1234567"
            inputMode="tel"
          />
        </div>
        <button type="submit" className="btn-navy" disabled={loading}>
          {loading ? 'Searching…' : 'Find My Orders'}
        </button>
      </form>

      {searched && orders.length === 0 && (
        <div className="empty-state">
          <h3>No orders found for this number</h3>
          <p>
            Check the number and try again — use the same number you entered at
            checkout.
          </p>
        </div>
      )}

      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}

      {deviceOrders.length > 0 && (
        <>
          <h2 className="section-title" style={{ margin: '28px 0 14px' }}>
            Orders placed on this device
          </h2>
          {deviceOrders
            .filter((o) => !orders.some((x) => x.id === o.id))
            .map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
        </>
      )}
    </div>
  );
}
