import { NextResponse } from 'next/server';
import {
  getBlogPostImageValue,
  getProductImageValues,
  hasDb,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/image?product=<id>&i=<index> — serves one stored product photo
// as binary. Uploaded photos live in Postgres as base64 data URLs; the
// storefront links to this route instead of embedding the data URL in page
// HTML, so listing pages stay light. Index 0 is the main photo, 1..4 are
// the gallery photos. If the stored value is a remote URL (pasted link),
// the browser is redirected straight to it.
//
// GET /api/image?post=<id> — the same, for a blog post photo (v5).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (!hasDb()) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Blog post photo (v5).
  const postParam = searchParams.get('post');
  if (postParam !== null) {
    const postId = Number(postParam);
    if (!Number.isFinite(postId) || postId <= 0) {
      return new NextResponse('Not found', { status: 404 });
    }
    const raw = await getBlogPostImageValue(postId);
    return serveImageValue(raw);
  }

  // Product photo.
  const productId = Number(searchParams.get('product'));
  const index = Number(searchParams.get('i') ?? '0');
  if (!Number.isFinite(productId) || !Number.isFinite(index) || index < 0) {
    return new NextResponse('Not found', { status: 404 });
  }
  const values = await getProductImageValues(productId);
  if (!values) {
    return new NextResponse('Not found', { status: 404 });
  }
  const raw =
    index === 0 ? values.image_url : (values.gallery[index - 1] ?? '');
  return serveImageValue(raw);
}

// Serve one stored image value: empty → 404; remote URL → redirect the
// browser straight to it; base64 data URL → binary with a day of caching.
function serveImageValue(raw: string | null): NextResponse {
  if (!raw) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (!raw.startsWith('data:')) {
    // Stored value is a remote URL — send the browser straight there.
    try {
      return NextResponse.redirect(raw);
    } catch {
      return new NextResponse('Not found', { status: 404 });
    }
  }

  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(raw);
  if (!match) {
    return new NextResponse('Not found', { status: 404 });
  }
  const [, mime, base64] = match;
  if (!mime.startsWith('image/')) {
    return new NextResponse('Not found', { status: 404 });
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(buffer.length),
      // Photos only change when the owner re-saves the product or post, so
      // a day of browser/CDN caching is safe and keeps repeat visits fast.
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
