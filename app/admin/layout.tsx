import AdminNav from '@/components/AdminNav';
import { isAdminLoggedIn } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedIn = await isAdminLoggedIn();

  // Not logged in: render only the child (the login page) without the sidebar.
  if (!loggedIn) return <>{children}</>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <AdminNav />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
