import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPostDate } from '@/lib/blog';
import { getBlogPostBySlug } from '@/lib/db';
import { blogImageSrc } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BlogArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  // Blank lines split the article into paragraphs; single line breaks
  // inside a paragraph are kept (pre-line in CSS).
  const paragraphs = post.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '');

  return (
    <div className="page-wrap">
      <Link href="/blog" className="article-back">
        ← Back to Blog
      </Link>
      <article className="article">
        <h1 className="page-title">{post.title}</h1>
        <p className="article-date">{formatPostDate(post.created_at)}</p>
        {post.image_url ? (
          <img
            src={blogImageSrc(post)}
            alt={post.title}
            className="article-image"
          />
        ) : null}
        {paragraphs.length === 0 ? (
          post.excerpt ? (
            <div className="article-body">
              <p>{post.excerpt}</p>
            </div>
          ) : null
        ) : (
          <div className="article-body">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
