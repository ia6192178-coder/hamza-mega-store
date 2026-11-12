import CheckoutForm from '@/components/CheckoutForm';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const settings = await getSettings();
  return <CheckoutForm settings={settings} />;
}
