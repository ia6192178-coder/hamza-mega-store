'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HERO_SLIDES } from '@/lib/seed-data';

export default function Hero() {
  const [index, setIndex] = useState(0);
  const total = HERO_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <section className="hero" aria-label="Featured offers">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`hero-slide ${i === index ? 'hero-slide-active' : ''}`}
          aria-hidden={i !== index}
        >
          <img src={slide.image} alt="" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <Link href={slide.href} className="btn-red btn-lg">
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}
      <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Previous slide">
        ‹
      </button>
      <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Next slide">
        ›
      </button>
      <div className="hero-dots">
        {HERO_SLIDES.map((slide, i) => (
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
