import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { BlogInputError, parseBlogPostBody } from '@/lib/blog';
import {
  createBlogPost,
  ensureBlogSchema,
  getBlogPosts,
  hasDb,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireAdminResponse(): Promise<NextResponse | null> {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  return null;
}

export async function GET() {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  // Make sure the table exists (in case /api/seed was not run after the
  // update) so the Blog page always works with real ids.
  await ensureBlogSchema();
  const posts = await getBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { post, error } = parseBlogPostBody(body);
    if (!post) {
      return NextResponse.json({ error: error ?? 'Invalid post.' }, { status: 400 });
    }
    const created = await createBlogPost(post);
    return NextResponse.json({ ok: true, post: created }, { status: 201 });
  } catch (err) {
    const status = err instanceof BlogInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create the post.' },
      { status },
    );
  }
}
