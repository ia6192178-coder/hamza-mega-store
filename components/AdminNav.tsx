'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const item = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={pathname === href ? 'admin-nav-active' : ''}
    >
      {label}
    </Link>
  );

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  return (
    <>
      <h3>🛍️ Admin Panel</h3>
      {item('/admin', '📊 Dashboard')}
      {item('/admin/products', '📦 Products')}
      {item('/admin/orders', '🧾 Orders')}
      {item('/admin/settings', '⚙️ Settings')}
      <Link href="/">🏪 View Store</Link>
      <button className="admin-nav-link" onClick={logout}>
        🚪 Logout
      </button>
    </>
  );
}
