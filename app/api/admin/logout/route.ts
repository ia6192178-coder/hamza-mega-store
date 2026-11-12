import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin';
import { hasDb, setSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/logout — clears the session token and the cookie.
export async function POST() {
  if (hasDb()) {
    try {
      await setSetting('admin_session_token', '');
    } catch {
      // still clear the cookie below
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
