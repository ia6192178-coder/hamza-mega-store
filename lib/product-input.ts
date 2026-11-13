import { MAX_EXTRA_IMAGES } from './types';

// Shared validation for product create/update payloads (admin API).
export type VariantInput = {
  label: string;
  price: number;
  old_price: number | null;
  stock: number;
};

export type ProductInput = {
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  description: string;
  image_url: string;
  // Extra photos (data URLs from uploads, or remote URLs). At most
  // MAX_EXTRA_IMAGES entries; empty strings are dropped.
  gallery: string[];
  stock: number;
  is_new: boolean;
  is_best_seller: boolean;
  is_clearance: boolean;
  is_sold_out: boolean;
  rating: number;
  // Option name shown above the selector (e.g. 'Size'). Empty = simple product.
  variant_label: string | null;
  variants: VariantInput[];
};

const MAX_VARIANTS = 20;
// One uploaded photo is ~100–200KB after browser compression; ~1.5M
// characters of base64 is roughly 1.1MB of binary — anything bigger is
// rejected so a single photo can never blow up the request. The total cap
// keeps the whole save under Vercel's 4.5MB serverless request limit.
const MAX_IMAGE_CHARS = 1_500_000;
const MAX_TOTAL_IMAGE_CHARS = 4_000_000;

export function parseProductBody(
  body: Record<string, unknown>,
): { product?: ProductInput; error?: string } {
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? '').trim();
  const price = Number(body.price);
  const oldRaw = body.old_price;
  const old_price =
    oldRaw === null || oldRaw === undefined || oldRaw === ''
      ? null
      : Number(oldRaw);
  const description = String(body.description ?? '').trim();
  const image_url = String(body.image_url ?? '').trim();
  const stock = Number(body.stock);
  const rating = Number(body.rating ?? 0);

  if (!name) return { error: 'Product name is required.' };
  if (!category) return { error: 'Category is required.' };
  if (!Number.isFinite(price) || price <= 0)
    return { error: 'Price must be a number greater than 0.' };
  if (old_price !== null && (!Number.isFinite(old_price) || old_price < 0))
    return { error: 'Old price must be a number, or empty.' };
  if (!Number.isFinite(stock) || stock < 0)
    return { error: 'Stock must be 0 or more.' };
  if (!Number.isFinite(rating) || rating < 0 || rating > 5)
    return { error: 'Rating must be between 0 and 5.' };

  // Photos: the main photo plus up to MAX_EXTRA_IMAGES gallery photos.
  // Uploaded photos arrive as base64 data URLs (compressed in the browser
  // first); pasted links arrive as remote URLs. Both are stored as-is.
  if (image_url.length > MAX_IMAGE_CHARS)
    return { error: 'The main photo is too large — please choose a smaller photo.' };
  const rawGallery = Array.isArray(body.gallery) ? body.gallery : [];
  if (rawGallery.length > MAX_EXTRA_IMAGES)
    return {
      error: `Too many extra photos — at most ${MAX_EXTRA_IMAGES} per product (plus the main photo).`,
    };
  const gallery: string[] = [];
  let totalImageChars = image_url.length;
  for (const item of rawGallery) {
    const value = String(item ?? '').trim();
    if (!value) continue;
    if (value.length > MAX_IMAGE_CHARS)
      return { error: 'One of the extra photos is too large — please choose a smaller photo.' };
    totalImageChars += value.length;
    gallery.push(value);
  }
  if (totalImageChars > MAX_TOTAL_IMAGE_CHARS)
    return {
      error:
        'The photos together are too large to save — please remove one or use smaller photos.',
    };

  // Variants: optional. An empty option name means a simple product — any
  // variant rows sent with it are ignored. With an option name, at least
  // one valid variant row is required.
  const variantLabelRaw = String(body.variant_label ?? '').trim();
  const variant_label = variantLabelRaw ? variantLabelRaw : null;
  const variants: VariantInput[] = [];
  if (variant_label) {
    const rawList = Array.isArray(body.variants) ? body.variants : [];
    if (rawList.length === 0)
      return { error: 'Add at least one variant (e.g. Size 7) or clear the option name.' };
    if (rawList.length > MAX_VARIANTS)
      return { error: `Too many variants — at most ${MAX_VARIANTS} per product.` };
    for (const item of rawList) {
      const row = (item ?? {}) as Record<string, unknown>;
      const label = String(row.label ?? '').trim();
      const vPrice = Number(row.price);
      const vOldRaw = row.old_price;
      const vOld =
        vOldRaw === null || vOldRaw === undefined || vOldRaw === ''
          ? null
          : Number(vOldRaw);
      const vStock = Number(row.stock);
      if (!label) return { error: 'Every variant needs a value (e.g. Size 9).' };
      if (!Number.isFinite(vPrice) || vPrice <= 0)
        return { error: `Variant "${label}" needs a price greater than 0.` };
      if (vOld !== null && (!Number.isFinite(vOld) || vOld < 0))
        return { error: `Variant "${label}" has an invalid old price.` };
      if (!Number.isFinite(vStock) || vStock < 0)
        return { error: `Variant "${label}" needs stock of 0 or more.` };
      variants.push({
        label,
        price: Math.round(vPrice),
        old_price: vOld === null ? null : Math.round(vOld),
        stock: Math.floor(vStock),
      });
    }
  }

  return {
    product: {
      name,
      category,
      price: Math.round(price),
      old_price: old_price === null ? null : Math.round(old_price),
      description,
      image_url,
      gallery,
      stock: Math.floor(stock),
      is_new: Boolean(body.is_new),
      is_best_seller: Boolean(body.is_best_seller),
      is_clearance: Boolean(body.is_clearance),
      is_sold_out: Boolean(body.is_sold_out),
      rating,
      variant_label,
      variants,
    },
  };
}
