'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { slugifyCategory } from '@/lib/categories';
import type { Product, Settings } from '@/lib/types';
import { formatRs } from '@/lib/types';
import { useCart } from './CartContext';

// v6.3: `announcementVisible` comes from the Design settings (Admin →
// Design → Header) — the owner can hide the announcement bar. It
// defaults to true when the prop is not passed.
export default function Header({
  settings,
  categories,
  announcementVisible = true,
}: {
  settings: Settings;
  categories: string[];
  announcementVisible?: boolean;
}) {
  const { count, openDrawer } = useCart();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Live search (debounced).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(Array.isArray(data.products) ? data.products.slice(0, 6) : []);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close the live-search dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setShowResults(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // v6.3: the announcement scrolls right-to-left as a marquee (pure CSS
  // animation, see globals.css). The text is repeated enough times that
  // the scrolling track is always at least ~5200px wide — twice a very
  // wide screen — so the loop never shows a gap, even for a very short
  // message. The count is always even, so the -50% animation lands
  // exactly on a copy boundary and the loop is seamless. One copy is
  // ~8px per character (13px font) plus the " • " separator.
  const announcementText = settings.announcement ?? '';
  const copyWidth = Math.max(1, (announcementText.length + 3) * 8);
  const repeatCount = Math.min(
    100,
    Math.max(2, Math.ceil(5200 / copyWidth / 2) * 2),
  );
  const announcementCopies = Array.from({ length: repeatCount }, (_, i) => (
    <span key={i} className="announcement-copy">
      {announcementText}
      <span className="announcement-sep" aria-hidden="true">
        &nbsp;&nbsp;•&nbsp;&nbsp;
      </span>
    </span>
  ));

  return (
    <header className="site-header">
      {announcementVisible && announcementText && (
        <div className="announcement">
          {/* The scrolling copies are hidden from screen readers — the
              sr-only span below carries the message once. */}
          <div className="announcement-marquee" aria-hidden="true">
            <div className="announcement-track">{announcementCopies}</div>
          </div>
          <span className="sr-only">{announcementText}</span>
          <a className="announcement-phone" href={`tel:${settings.phone}`}>
            Call Us: {settings.phone}
          </a>
        </div>
      )}

      <div className="header-main">
        <button
          className="mobile-menu-btn"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          ☰
        </button>

        <Link href="/" className="logo">
          <span className="logo-mark">H</span>
          <span className="logo-text">
            <strong>HAMZA MEGA STORE</strong>
            <small>Quality Products • Best Prices</small>
          </span>
        </Link>

        <div className="search-box" ref={searchRef}>
          <form onSubmit={submitSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search">
              🔍
            </button>
          </form>
          {showResults && results.length > 0 && (
            <div className="search-results">
              {results.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="search-result"
                  onClick={() => setShowResults(false)}
                >
                  <img src={p.image_url} alt="" width={44} height={44} />
                  <span className="search-result-name">{p.name}</span>
                  <span className="search-result-price">{formatRs(p.price)}</span>
                </Link>
              ))}
              <button
                className="search-result-all"
                onClick={() => {
                  setShowResults(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                See all results for “{query.trim()}” →
              </button>
            </div>
          )}
        </div>

        <div className="header-actions">
          <Link href="/orders" className="header-link">
            <span className="header-link-icon">📦</span>
            <span className="header-link-text">My Orders</span>
          </Link>
          <button className="cart-btn" onClick={openDrawer} aria-label="Open cart">
            🛒
            {count > 0 && <span className="cart-count">{count}</span>}
            <span className="header-link-text">Cart</span>
          </button>
        </div>
      </div>

      <nav className="nav-bar">
        <div
          className="cat-dropdown"
          onMouseEnter={() => setCatOpen(true)}
          onMouseLeave={() => setCatOpen(false)}
        >
          <button
            className="cat-dropdown-btn"
            onClick={() => setCatOpen((v) => !v)}
            aria-expanded={catOpen}
          >
            ☰ All Categories ▾
          </button>
          {catOpen && (
            <div className="cat-dropdown-menu">
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/category/${slugifyCategory(c)}`}
                  onClick={() => setCatOpen(false)}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/#new-arrivals">New Arrivals</Link>
          <Link href="/#best-sellers">Best Sellers</Link>
          <Link href="/#clearance">Clearance Sale</Link>
          <Link href="/about">About Us</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/contact">Contact Us</Link>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-nav">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/category/${slugifyCategory(c)}`}
              onClick={() => setMobileOpen(false)}
            >
              {c}
            </Link>
          ))}
          <Link href="/orders" onClick={() => setMobileOpen(false)}>
            My Orders
          </Link>
          <Link href="/about" onClick={() => setMobileOpen(false)}>
            About Us
          </Link>
          <Link href="/blog" onClick={() => setMobileOpen(false)}>
            Blog
          </Link>
          <Link href="/reviews" onClick={() => setMobileOpen(false)}>
            Reviews
          </Link>
          <Link href="/contact" onClick={() => setMobileOpen(false)}>
            Contact Us
          </Link>
          <Link href="/admin" onClick={() => setMobileOpen(false)}>
            Admin
          </Link>
        </div>
      )}
    </header>
  );
}
