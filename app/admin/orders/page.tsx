import AdminOrdersClient from '@/components/AdminOrdersClient';
import { requireAdmin } from '@/lib/admin';
import { getOrdersWithItems } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getOrdersWithItems();
  return (
    <>
      <h1>Orders</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        All customer orders, newest first. Change the status as you process each
        order.
      </p>
      <AdminOrdersClient initialOrders={orders} />
    </>
  );
}
