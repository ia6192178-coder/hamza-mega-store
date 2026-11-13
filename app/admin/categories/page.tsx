import AdminCategoriesClient from '@/components/AdminCategoriesClient';
import { requireAdmin } from '@/lib/admin';
import { ensureCategorySchema, getCategoriesWithCounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  await requireAdmin();
  // Make sure the categories table exists (in case /api/seed was not run
  // after the update) so this page always works with real ids.
  await ensureCategorySchema();
  const categories = await getCategoriesWithCounts();
  return (
    <>
      <h1>Categories</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Categories group your products on the store. Add a new category, rename
        one (its products move with it), or delete a category that has no
        products. Changes appear on the store immediately.
      </p>
      <AdminCategoriesClient initialCategories={categories} />
    </>
  );
}
