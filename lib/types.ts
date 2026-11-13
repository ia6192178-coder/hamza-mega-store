export type ProductVariant = {
  id: number;
  product_id: number;
  label: string;
  price: number;
  old_price: number | null;
  stock: number;
  sort_order: number;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  description: string;
  image_url: string;
  // Extra photos (up to 4) shown as thumbnails on the product page.
  // Each entry is either a remote URL or a /api/image route URL — the
  // database stores uploaded photos as base64 data URLs, but those are
  // never sent to the browser in page data (see mapProduct in lib/db.ts).
  gallery: string[];
  stock: number;
  is_new: boolean;
  is_best_seller: boolean;
  is_clearance: boolean;
  is_sold_out: boolean;
  rating: number;
  created_at?: string;
  // Name of the variant option (e.g. 'Size', 'Color', 'Weight').
  // Null/empty means a simple product with no variants.
  variant_label: string | null;
  // Variants, ordered by sort_order. Empty/undefined for simple products.
  variants?: ProductVariant[];
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  // Variant chosen for this line (null for simple products / old orders).
  variant_label: string | null;
  variant_price: number | null;
};

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  total: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
};

export type Settings = Record<string, string>;

export function formatRs(amount: number): string {
  return `Rs ${Number(amount).toLocaleString('en-US')}`;
}

export function discountPercent(p: Product): number | null {
  if (!p.old_price || p.old_price <= p.price) return null;
  return Math.round(((p.old_price - p.price) / p.old_price) * 100);
}

// ---------- Product image helpers ----------

/** Max extra photos per product (plus the 1 main photo = 5 total). */
export const MAX_EXTRA_IMAGES = 4;

/**
 * Display URL for one of a product's images: index 0 is the main photo,
 * 1..4 are the gallery photos. Uploaded photos are stored in the database
 * as base64 data URLs — those are served through the /api/image route so
 * the page HTML stays light. Remote URLs (e.g. Unsplash) are used as-is.
 * (Server-side, mapProduct already rewrites data URLs to route URLs, so
 * the 'data:' branch here is a safety net for any raw value that slips
 * through, e.g. a freshly uploaded photo in the admin form.)
 */
export function imageSrc(product: Product, index = 0): string {
  const raw =
    index === 0
      ? product.image_url
      : (product.gallery?.[index - 1] ?? '');
  if (!raw) return '';
  if (raw.startsWith('data:')) {
    return `/api/image?product=${product.id}&i=${index}`;
  }
  return raw;
}

/** All display image URLs for a product: main photo first, then gallery. */
export function productImages(product: Product): string[] {
  const images = [imageSrc(product, 0)];
  (product.gallery ?? []).forEach((_, i) => {
    images.push(imageSrc(product, i + 1));
  });
  return images.filter((src) => src !== '');
}

// ---------- Variant helpers ----------

export function productHasVariants(p: Product): boolean {
  return (p.variants?.length ?? 0) > 0;
}

/** Lowest variant price (for "From Rs …" on cards), or the base price. */
export function productMinPrice(p: Product): number {
  if (!productHasVariants(p)) return p.price;
  return Math.min(...(p.variants as ProductVariant[]).map((v) => v.price));
}

/** Total stock across variants, or the base stock for simple products. */
export function productTotalStock(p: Product): number {
  if (!productHasVariants(p)) return p.stock;
  return (p.variants as ProductVariant[]).reduce((sum, v) => sum + v.stock, 0);
}

/** Sold out when flagged, or when every variant (or the base stock) is 0. */
export function productSoldOut(p: Product): boolean {
  if (p.is_sold_out) return true;
  return productTotalStock(p) <= 0;
}

/** Best discount across the product's variants (for card badges). */
export function variantBestDiscount(p: Product): number | null {
  if (!productHasVariants(p)) return discountPercent(p);
  let best: number | null = null;
  for (const v of p.variants as ProductVariant[]) {
    if (v.old_price && v.old_price > v.price) {
      const off = Math.round(((v.old_price - v.price) / v.old_price) * 100);
      if (best === null || off > best) best = off;
    }
  }
  return best;
}

/** Discount for one selected variant. */
export function variantDiscount(v: ProductVariant): number | null {
  if (!v.old_price || v.old_price <= v.price) return null;
  return Math.round(((v.old_price - v.price) / v.old_price) * 100);
}
