import CartPageClient from '@/components/CartPageClient';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const settings = await getSettings();
  return <CartPageClient settings={settings} />;
}
