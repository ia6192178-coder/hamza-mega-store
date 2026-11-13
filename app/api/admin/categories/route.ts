import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { CategoryInputError } from '@/lib/categories';
import {
  createCategory,
  ensureCategorySchema,
  getCategoriesWithCounts,
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
  // update) so the Categories page always works with real ids.
  await ensureCategorySchema();
  const categories = await getCategoriesWithCounts();
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  try {
    const body = await req.json();
    const category = await createCategory(String(body.name ?? ''));
    // `existed: true` means the name was already there (case-insensitive)
    // — the caller just uses the existing category.
    return NextResponse.json(
      { ok: true, category },
      { status: category.existed ? 200 : 201 },
    );
  } catch (err) {
    const status = err instanceof CategoryInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create the category.' },
      { status },
    );
  }
}
