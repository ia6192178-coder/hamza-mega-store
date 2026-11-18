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
        Categories group your products on the store. Click a category to open
        it — a dialog lets you change its name and add its own photo, which
        shows on its home page tile and at the top of its page. Changes appear
        on the store immediately.
      </p>
      <AdminCategoriesClient initialCategories={categories} />
    </>
  );
}
