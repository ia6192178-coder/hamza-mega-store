import AdminBlogClient from '@/components/AdminBlogClient';
import { requireAdmin } from '@/lib/admin';
import { ensureBlogSchema, getBlogPosts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  await requireAdmin();
  // Make sure the blog_posts table exists (in case /api/seed was not run
  // after the update) so this page always works with real ids.
  await ensureBlogSchema();
  const posts = await getBlogPosts();
  return (
    <>
      <h1>Blog</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Write shopping guides, home ideas and product tips for your
        customers. New posts appear on the Blog page immediately.
      </p>
      <AdminBlogClient initialPosts={posts} />
    </>
  );
}
