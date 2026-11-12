import AdminSettingsClient from '@/components/AdminSettingsClient';
import { requireAdmin } from '@/lib/admin';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <h1>Settings</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Store contact details, delivery charges and your admin password. Changes
        take effect across the store immediately.
      </p>
      <AdminSettingsClient initialSettings={settings} />
    </>
  );
}
