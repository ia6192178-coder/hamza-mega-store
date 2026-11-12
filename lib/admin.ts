import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSettings } from './db';

export const ADMIN_COOKIE = 'hms_admin_session';

// The admin session is a random token stored in the settings table and in an
// HTTP-only cookie. A request is admin when the cookie matches the stored token.
export async function isAdminLoggedIn(): Promise<boolean> {
  try {
    const token = cookies().get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    const settings = await getSettings();
    const stored = settings.admin_session_token;
    return Boolean(stored) && token === stored;
  } catch {
    return false;
  }
}

// Call at the top of every protected admin page.
export async function requireAdmin(): Promise<void> {
  const ok = await isAdminLoggedIn();
  if (!ok) redirect('/admin/login');
}
