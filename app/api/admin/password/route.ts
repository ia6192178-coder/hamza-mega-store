import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { getSettings, hasDb, setSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/admin/password — { current_password, new_password }
export async function PUT(req: Request) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  try {
    const body = await req.json();
    const current = String(body.current_password ?? '');
    const next = String(body.new_password ?? '');
    const settings = await getSettings();
    if (current !== settings.admin_password) {
      return NextResponse.json(
        { error: 'Current password is wrong.' },
        { status: 401 },
      );
    }
    if (next.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters.' },
        { status: 400 },
      );
    }
    await setSetting('admin_password', next);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not change password.' },
      { status: 500 },
    );
  }
}
