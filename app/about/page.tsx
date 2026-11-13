import Link from 'next/link';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="page-wrap">
      <h1 className="page-title">About {settings.store_name}</h1>
      <p className="page-subtitle">
        Quality products, honest prices, delivered to your doorstep.
      </p>

      <div className="card prose">
        <p>
          <strong>{settings.store_name}</strong> is a Pakistani online shopping
          store based in {settings.address}. We started with a simple idea:
          good-quality everyday products should be easy to buy, fairly priced,
          and delivered to your home without any hassle.
        </p>
        <p>
          Today we stock hundreds of products across 10 categories — Kitchen
          &amp; Dining, Home &amp; Living, Footwear, Baby &amp; Kids Toys, Home
          Decor, Bathroom Accessories, Mobile Accessories, Organizers, Health
          &amp; Fitness, and Tool Kits. Every product is checked before it is
          listed, and every order is packed with care.
        </p>

        <h2>Why customers choose us</h2>
        <ul>
          <li>
            <strong>Cash on Delivery</strong> — pay only when your parcel
            arrives. No advance payment, no risk.
          </li>
          <li>
            <strong>Free delivery over Rs 7,000</strong> — big orders ship free
            anywhere in Pakistan.
          </li>
          <li>
            <strong>7-day easy exchange</strong> — if an item arrives damaged or
            wrong, we exchange it quickly.
          </li>
          <li>
            <strong>Real support</strong> — call us or message us on WhatsApp
            and a real person helps you.
          </li>
        </ul>

        <h2>Visit or contact us</h2>
        <p>
          📍 {settings.address}
          <br />
          📞{' '}
          <a href={`tel:${settings.phone}`} style={{ fontWeight: 700 }}>
            {settings.phone}
          </a>
          <br />
          ✉️{' '}
          <a href={`mailto:${settings.email}`} style={{ fontWeight: 700 }}>
            {settings.email}
          </a>
          <br />
          <WhatsAppIcon size={17} />{' '}
          <a
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 700 }}
          >
            WhatsApp us
          </a>
        </p>

        <p>
          <Link href="/" className="btn-navy">
            Start Shopping
          </Link>
        </p>
      </div>
    </div>
  );
}
