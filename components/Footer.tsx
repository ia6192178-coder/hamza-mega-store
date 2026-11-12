import Link from 'next/link';
import { CATEGORIES, slugifyCategory } from '@/lib/categories';
import type { Settings } from '@/lib/types';

export default function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h3>HAMZA MEGA STORE</h3>
          <p>
            Your one-stop online shop for kitchen, home, fashion, toys and more —
            quality products at honest prices, delivered to your doorstep.
          </p>
          <p className="footer-contact-line">
            📞 <a href={`tel:${settings.phone}`}>{settings.phone}</a>
          </p>
          <p className="footer-contact-line">
            ✉️ <a href={`mailto:${settings.email}`}>{settings.email}</a>
          </p>
          <p className="footer-contact-line">📍 {settings.address}</p>
          <p className="footer-contact-line">
            💬{' '}
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Us
            </a>
          </p>
        </div>

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

        <div className="footer-col">
          <h4>Categories</h4>
          {CATEGORIES.slice(0, 7).map((c) => (
            <Link key={c} href={`/category/${slugifyCategory(c)}`}>
              {c}
            </Link>
          ))}
        </div>

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
