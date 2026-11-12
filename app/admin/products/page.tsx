import AdminProductsClient from '@/components/AdminProductsClient';
import { requireAdmin } from '@/lib/admin';
import { getProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getProducts();
  return (
    <>
      <h1>Products</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Add, edit or delete products. Changes appear on the store immediately.
      </p>
      <AdminProductsClient initialProducts={products} />
    </>
  );
}
