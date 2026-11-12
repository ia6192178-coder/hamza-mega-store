// Shared validation for product create/update payloads (admin API).
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
};

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
    },
  };
}
