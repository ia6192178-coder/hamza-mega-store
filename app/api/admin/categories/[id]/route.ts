import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { CategoryInputError } from '@/lib/categories';
import { deleteCategory, hasDb, renameCategory } from '@/lib/db';

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
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const category = await renameCategory(id, String(body.name ?? ''));
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    const status = err instanceof CategoryInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not rename the category.' },
      { status },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = parseId(params);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 });
  }
  try {
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof CategoryInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not delete the category.' },
      { status },
    );
  }
}
