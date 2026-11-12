import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/AdminLoginForm';
import { isAdminLoggedIn } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  if (await isAdminLoggedIn()) redirect('/admin');
  return (
    <div className="page-wrap">
      <AdminLoginForm />
    </div>
  );
}
