import Link from 'next/link';
import { formatPostDate } from '@/lib/blog';
import { getBlogPosts } from '@/lib/db';
import { blogImageSrc } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  // Posts come from the database (managed in the Admin Panel). When the
  // table is not there yet (migration not run), the 3 original posts are
  // shown instead — the page never breaks.
  const posts = await getBlogPosts();

  return (
    <div className="page-wrap">
      <h1 className="page-title">Our Blog</h1>
      <p className="page-subtitle">
        Shopping guides, home ideas and product tips from the Hamza Mega Store
        team.
      </p>

      {posts.length === 0 ? (
        <div className="empty-state">
          <h3>No blog posts yet</h3>
          <p>Check back soon — new guides and tips are added regularly.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              {post.image_url ? (
                <img
                  src={blogImageSrc(post)}
                  alt={post.title}
                  loading="lazy"
                />
              ) : null}
              <div className="blog-card-body">
                <p
                  style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}
                >
                  {formatPostDate(post.created_at)}
                </p>
                <h3>{post.title}</h3>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
