import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { BlogInputError, parseBlogPostBody } from '@/lib/blog';
import {
  deleteBlogPost,
  ensureBlogSchema,
  getBlogPostImageValue,
  hasDb,
  resolveBlogImageValue,
  updateBlogPost,
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

type RouteContext = { params: { id: string } };

function parseId(params: RouteContext['params']): number | null {
  const id = Number(params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PUT(req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = parseId(params);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const { post, error } = parseBlogPostBody(body);
    if (!post) {
      return NextResponse.json({ error: error ?? 'Invalid post.' }, { status: 400 });
    }
    // Make sure the table exists before the update (in case /api/seed was
    // not run after the update).
    await ensureBlogSchema();
    // A photo the owner did not touch comes back as an /api/image URL —
    // resolve it to the stored value so it is kept. A fresh upload (data
    // URL) or pasted link is stored as-is; a removed photo arrives as an
    // empty string and is dropped.
    const existing = await getBlogPostImageValue(id);
    const imageUrl = resolveBlogImageValue(post.image_url, id, existing);
    const updated = await updateBlogPost(id, { ...post, image_url: imageUrl });
    return NextResponse.json({ ok: true, post: updated });
  } catch (err) {
    const status = err instanceof BlogInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update the post.' },
      { status },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = parseId(params);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid post id.' }, { status: 400 });
  }
  try {
    await deleteBlogPost(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof BlogInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not delete the post.' },
      { status },
    );
  }
}
