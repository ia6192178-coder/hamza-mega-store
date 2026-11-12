import ContactForm from '@/components/ContactForm';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="page-wrap">
      <h1 className="page-title">Contact Us</h1>
      <p className="page-subtitle">
        Questions about an order or a product? We are happy to help.
      </p>
      <ContactForm settings={settings} />
    </div>
  );
}
