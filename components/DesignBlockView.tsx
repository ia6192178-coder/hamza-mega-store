// Renders one custom design block (v6.3) on the storefront home page.
// Text and image blocks render inside the page-wrap (inWrap = true);
// banner and promo blocks are full-width (inWrap = false). The home page
// groups consecutive in-wrap items into one .page-wrap div, and renders
// full-width items outside it.

import Link from 'next/link';
import type { DesignBlock } from '@/lib/types';
import { blockImageSrc } from '@/lib/types';

// Does this block type render inside the page-wrap (true) or full-width
// (false)? Shared with app/page.tsx so the layout grouping matches.
export function blockIsInWrap(block: DesignBlock): boolean {
  return block.type === 'text' || block.type === 'image';
}

export default function DesignBlockView({ block }: { block: DesignBlock }) {
  const c = block.content;

  if (block.type === 'text') {
    return (
      <section className="section" data-reveal>
        <div className="card">
          {c.heading && (
            <h2 className="section-title" style={{ marginBottom: 8 }}>
              {c.heading}
            </h2>
          )}
          {c.body && (
            <p
              style={{
                color: '#37415a',
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {c.body}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (block.type === 'image') {
    const src = blockImageSrc(block);
    if (!src) return null;
    const img = (
      <img
        src={src}
        alt={c.caption || ''}
        loading="lazy"
        className="design-block-image"
      />
    );
    return (
      <section className="section" data-reveal>
        {c.link ? (
          <Link href={c.link} className="design-block-image-link">
            {img}
          </Link>
        ) : (
          img
        )}
        {c.caption && (
          <p className="design-block-caption">{c.caption}</p>
        )}
      </section>
    );
  }

  if (block.type === 'banner') {
    const src = blockImageSrc(block);
    if (!src) return null;
    return (
      <section className="design-banner" aria-label={c.heading || 'Offer'} data-reveal>
        <img src={src} alt="" loading="lazy" />
        <div className="design-banner-overlay" />
        <div className="design-banner-content">
          {c.heading && <h2>{c.heading}</h2>}
          {c.subtext && <p>{c.subtext}</p>}
          {c.button_text && (
            <Link href={c.button_link || '/'} className="btn-red btn-lg">
              {c.button_text}
            </Link>
          )}
        </div>
      </section>
    );
  }

  // promo strip
  return (
    <section
      className="design-promo"
      style={{ background: c.bg_color || 'var(--red)' }}
      data-reveal
    >
      <p>{c.text}</p>
    </section>
  );
}
