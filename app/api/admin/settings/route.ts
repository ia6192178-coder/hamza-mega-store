import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { getSettings, hasDb, setSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Only these keys can be changed from the admin Settings page.
const EDITABLE_KEYS = [
  'phone',
  'whatsapp',
  'email',
  'address',
  'delivery_fee',
  'free_delivery_threshold',
  'announcement',
];

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

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
    const incoming = (body.settings ?? {}) as Record<string, unknown>;

    for (const key of EDITABLE_KEYS) {
      if (!(key in incoming)) continue;
      const value = String(incoming[key] ?? '');
      if (key === 'delivery_fee' || key === 'free_delivery_threshold') {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json(
            { error: `${key} must be a number, 0 or more.` },
            { status: 400 },
          );
        }
      }
      await setSetting(key, value);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not save settings.' },
      { status: 500 },
    );
  }
}
