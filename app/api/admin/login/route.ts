import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin';
import { getSettings, hasDb, setSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/login — { password } → sets an HTTP-only session cookie.
export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. The store owner must run /api/seed first.' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const password = String(body.password ?? '');
    const settings = await getSettings();
    if (!password || password !== settings.admin_password) {
      return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
    }

    const token = randomUUID();
    await setSetting('admin_session_token', token);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed.' },
      { status: 500 },
    );
  }
}
