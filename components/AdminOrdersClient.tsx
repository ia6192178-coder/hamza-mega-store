'use client';

import { useState } from 'react';
import type { Order } from '@/lib/types';
import { formatRs } from '@/lib/types';

const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');

  const changeStatus = async (id: number, status: string) => {
    setError('');
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update status.');
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <h3>No orders yet</h3>
        <p>Orders placed by customers will appear here.</p>
      </div>
    );
  }

  return (
    <>
      {error && <div className="form-error">{error}</div>}
      {orders.map((o) => (
        <div key={o.id} className="order-card">
          <div className="order-card-head">
            <strong>{o.order_number}</strong>
            <span>
              <span
                className={`status-badge status-${o.status}`}
                style={{ marginRight: 8 }}
              >
                {o.status}
              </span>
              <select
                className="input"
                style={{ width: 'auto', display: 'inline-block', padding: '6px 8px' }}
                value={o.status}
                disabled={updating === o.id}
                onChange={(e) => changeStatus(o.id, e.target.value)}
                aria-label={`Change status of ${o.order_number}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>{o.customer_name}</strong> •{' '}
            <a href={`tel:${o.phone}`}>{o.phone}</a> • {o.city}
            <br />
            <span style={{ color: 'var(--muted)' }}>
              {new Date(o.created_at).toLocaleString('en-PK', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              • {o.address}
            </span>
          </div>
          {(o.items ?? []).map((item) => (
            <div key={item.id} className="order-item-line">
              <span>
                {item.product_name}
                {item.variant_label ? ` — ${item.variant_label}` : ''} ×{' '}
                {item.quantity}
              </span>
              <strong>{formatRs(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div
            className="summary-row"
            style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}
          >
            <span>
              Total (incl.{' '}
              {o.delivery_fee === 0 ? 'FREE' : formatRs(o.delivery_fee)} delivery)
            </span>
            <strong>{formatRs(o.total)}</strong>
          </div>
        </div>
      ))}
    </>
  );
}
