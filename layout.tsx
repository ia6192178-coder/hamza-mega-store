import type { Metadata } from 'next';
import { CartProvider } from '@/components/CartContext';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getSettings } from '@/lib/db';
import './globals.css';

// Always render on the server at request time: the storefront reads products
// and settings live from Postgres, and `next build` must never touch the DB.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hamza Mega Store — Online Shopping in Pakistan',
  description:
    'Hamza Mega Store — kitchen, home, footwear, toys, decor and more. Cash on Delivery across Pakistan. Free delivery on orders over Rs 7,000.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header settings={settings} />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer settings={settings} />
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-float"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
          >
            💬
          </a>
        </CartProvider>
      </body>
    </html>
  );
}
