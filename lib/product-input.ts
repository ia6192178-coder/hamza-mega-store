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
