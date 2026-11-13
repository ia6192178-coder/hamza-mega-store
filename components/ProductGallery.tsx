'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { productImages } from '@/lib/types';

// Product photos on the detail page: a large main photo with clickable
// thumbnails underneath when the product has more than one photo (main
// photo + up to 4 gallery photos). The discount / sold-out badges stay on
// the large photo, exactly as before.
export default function ProductGallery({
  product,
  off,
  soldOut,
}: {
  product: Product;
  off: number | null;
  soldOut: boolean;
}) {
  const images = productImages(product);
  const [selected, setSelected] = useState(0);
  const current = images[Math.min(selected, images.length - 1)] ?? '';

  if (images.length === 0) {
    return (
      <div
        className="product-detail-image"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          aspectRatio: '1 / 1',
        }}
      >
        No photo
      </div>
    );
  }

  return (
    <div>
      <div className="product-detail-image">
        <img src={current} alt={product.name} />
        {off !== null && <span className="pc-badge pc-badge-off">{off}% OFF</span>}
        {soldOut && <span className="pc-soldout">SOLD OUT</span>}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              className={`gallery-thumb${i === selected ? ' active' : ''}`}
              onClick={() => setSelected(i)}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === selected}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
