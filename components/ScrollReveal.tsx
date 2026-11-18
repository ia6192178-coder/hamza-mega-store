'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Scroll-reveal (v6.3): one tiny IntersectionObserver for the whole site.
// Elements marked with `data-reveal` fade/slide in when they scroll into
// view (see the [data-reveal] rules in globals.css). Mounted once in the
// root layout; the scan re-runs on every route change, because client-side
// navigation renders new elements without remounting the layout.
//
// The hidden starting state only applies once JS adds the `js-reveal`
// class to <html> — without JS (or without IntersectionObserver support)
// every element stays visible as normal, so content can never get stuck
// hidden. After an element's reveal finishes, its data-reveal attribute
// is removed, so its own hover transitions take over untouched.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    document.documentElement.classList.add('js-reveal');

    const cleanUp = (el: Element) => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-visible');
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          observer.unobserve(el);
          el.classList.add('is-visible');
          // Remove the reveal hooks once the entrance finishes, so the
          // element's own hover transitions work natively afterwards.
          // The timeout is a fallback for transitionend never firing
          // (e.g. the tab was hidden): 200ms max stagger + 600ms reveal.
          const onEnd = (e: Event) => {
            if (e instanceof TransitionEvent && e.propertyName !== 'opacity') {
              return;
            }
            el.removeEventListener('transitionend', onEnd);
            cleanUp(el);
          };
          el.addEventListener('transitionend', onEnd);
          window.setTimeout(() => {
            el.removeEventListener('transitionend', onEnd);
            cleanUp(el);
          }, 1200);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    );

    document
      .querySelectorAll('[data-reveal]:not(.is-visible)')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
