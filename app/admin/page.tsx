import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { getOrdersWithItems, getProducts } from '@/lib/db';
import { formatRs } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireAdmin();
  const [products, orders] = await Promise.all([
    getProducts(),
    getOrdersWithItems(),
  ]);

  const pending = orders.filter((o) => o.status === 'Pending').length;
  const outOfStock = products.filter(
    (p) => p.is_sold_out || p.stock <= 0,
  ).length;
  const revenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Welcome to your store admin panel. Manage products, orders and settings
        here — no code needed.
      </p>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="stat-num">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="admin-stat">
          <div className="stat-num">{orders.length}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="admin-stat">
          <div className="stat-num">{pending}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="admin-stat">
          <div className="stat-num">{outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 6px', color: 'var(--navy)' }}>
          Total sales (excluding cancelled): {formatRs(revenue)}
        </h3>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
          Quick actions:{' '}
          <Link href="/admin/products" style={{ color: 'var(--red)', fontWeight: 700 }}>
            Add a product
          </Link>{' '}
          •{' '}
          <Link href="/admin/orders" style={{ color: 'var(--red)', fontWeight: 700 }}>
            View pending orders
          </Link>{' '}
          •{' '}
          <Link href="/admin/settings" style={{ color: 'var(--red)', fontWeight: 700 }}>
            Change store settings
          </Link>
        </p>
      </div>

      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Recent Orders
      </h2>
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet. Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>City</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.order_number}</strong>
                  </td>
                  <td>
                    {o.customer_name}
                    <br />
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {o.phone}
                    </span>
                  </td>
                  <td>{o.city}</td>
                  <td>{formatRs(o.total)}</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
