import Link from 'next/link';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { slugifyCategory } from '@/lib/categories';
import { DEFAULT_FOOTER, type DesignFooter } from '@/lib/design';
import type { Settings } from '@/lib/types';

// v6.3: `footerDesign` comes from the Design settings (Admin → Design →
// Footer) — the owner can change the about text and hide footer columns.
// Without it, the built-in footer is shown.
export default function Footer({
  settings,
  categories,
  footerDesign,
}: {
  settings: Settings;
  categories: string[];
  footerDesign?: DesignFooter;
}) {
  const design = footerDesign ?? DEFAULT_FOOTER;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h3>HAMZA MEGA STORE</h3>
          <p>{design.about}</p>
          <p className="footer-contact-line">
            📞 <a href={`tel:${settings.phone}`}>{settings.phone}</a>
          </p>
          <p className="footer-contact-line">
            ✉️ <a href={`mailto:${settings.email}`}>{settings.email}</a>
          </p>
          <p className="footer-contact-line">📍 {settings.address}</p>
          <p className="footer-contact-line">
            <WhatsAppIcon size={17} />{' '}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Us
            </a>
          </p>
        </div>

        {design.show_links && (
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link href="/">Home</Link>
            <Link href="/#new-arrivals">New Arrivals</Link>
            <Link href="/#best-sellers">Best Sellers</Link>
            <Link href="/#clearance">Clearance Sale</Link>
            <Link href="/orders">My Orders</Link>
            <Link href="/about">About Us</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
        )}

        {design.show_categories && (
          <div className="footer-col">
            <h4>Categories</h4>
            {categories.slice(0, 7).map((c) => (
              <Link key={c} href={`/category/${slugifyCategory(c)}`}>
                {c}
              </Link>
            ))}
          </div>
        )}

        {design.show_service && (
          <div className="footer-col">
            <h4>Customer Service</h4>
          <p>Cash on Delivery (COD) available across Pakistan.</p>
          <p>
            Delivery charges: Rs {settings.delivery_fee} — free on orders over Rs{' '}
            {Number(settings.free_delivery_threshold).toLocaleString('en-US')}.
          </p>
          <p>7-day easy exchange on damaged or wrong items.</p>
          <p>
            Questions? Call us at{' '}
            <a href={`tel:${settings.phone}`}>{settings.phone}</a> or message us on{' '}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            .
          </p>
          </div>
        )}
      </div>

      <div className="footer-bottom">
        <span>
          © {year} {settings.store_name} — {settings.address}. All rights reserved.
        </span>
        <Link href="/admin" className="footer-admin-link">
          Admin
        </Link>
      </div>
    </footer>
  );
}
