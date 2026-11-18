'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HeroSlide } from '@/lib/design';

// The home page hero slideshow. v6.3: the slides come from the Design
// settings (Admin → Design) — the owner can change the title, subtitle,
// button and photo of each slide. The server always passes at least one
// slide (the built-in defaults when nothing is saved), so `slides` is
// required here — this client component must not import lib/design's
// defaults itself (that would ship the seed data to the browser).
export default function Hero({ slides }: { slides: HeroSlide[] }) {
  const list = slides;
  const [index, setIndex] = useState(0);
  const total = list.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  if (total === 0) return null;

  return (
    <section className="hero" aria-label="Featured offers">
      {list.map((slide, i) => (
        <div
          key={slide.title}
          className={`hero-slide ${i === index ? 'hero-slide-active' : ''}`}
          aria-hidden={i !== index}
        >
          <img src={slide.image} alt="" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>{slide.title}</h1>
            {slide.subtitle && <p>{slide.subtitle}</p>}
            {slide.button_text && (
              <Link href={slide.button_link || '/'} className="btn-red btn-lg">
                {slide.button_text}
              </Link>
            )}
          </div>
        </div>
      ))}
      {total > 1 && (
        <>
          <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Previous slide">
            ‹
          </button>
          <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Next slide">
            ›
          </button>
        </>
      )}
      <div className="hero-dots">
        {list.map((slide, i) => (
          <button
            key={slide.title}
            className={`hero-dot ${i === index ? 'hero-dot-active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
