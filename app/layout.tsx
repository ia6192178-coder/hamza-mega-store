import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { CartProvider } from '@/components/CartContext';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ScrollReveal from '@/components/ScrollReveal';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { getCategories, getDesign, getSettings } from '@/lib/db';
import {
  NAVY_2_SHIFT,
  NAVY_3_SHIFT,
  RED_DARK_SHIFT,
  shiftColor,
} from '@/lib/design';
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
  const [settings, categories, design] = await Promise.all([
    getSettings(),
    getCategories(),
    // The layout only needs theme/header/footer — the home layout is not
    // used here, so no block ids are passed ([] is fine).
    getDesign([]),
  ]);

  // v6.3: the owner's theme (Admin → Design) is applied as CSS variables
  // on <body>, so it colours the whole site — header, buttons, prices,
  // footer — without a rebuild. The derived shades (nav bar, button
  // hover) follow the primary/accent colours automatically. With no saved
  // theme the variables equal the built-in defaults.
  const themeStyle = {
    '--navy': design.theme.primary,
    '--navy-2': shiftColor(design.theme.primary, ...NAVY_2_SHIFT),
    '--navy-3': shiftColor(design.theme.primary, ...NAVY_3_SHIFT),
    '--red': design.theme.accent,
    '--red-dark': shiftColor(design.theme.button_bg, ...RED_DARK_SHIFT),
    '--header-bg': design.theme.header_bg,
    '--btn-bg': design.theme.button_bg,
  } as CSSProperties;

  return (
    <html lang="en">
      <body style={themeStyle}>
        {/* v6.3: scroll-reveal animations for the whole site. */}
        <ScrollReveal />
        <CartProvider>
          <Header
            settings={settings}
            categories={categories}
            announcementVisible={design.header.announcement_visible}
          />
          <main>{children}</main>
          <Footer
            settings={settings}
            categories={categories}
            footerDesign={design.footer}
          />
          <CartDrawer settings={settings} />
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-float"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon size={30} color="#ffffff" />
          </a>
        </CartProvider>
      </body>
    </html>
  );
}
