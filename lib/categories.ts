// The 10 original categories. Since v4, categories live in the database
// (the `categories` table) and the owner can add, rename and delete them
// from the Admin Panel — this list is only the FALLBACK, used when the
// database (or the categories table) is not there yet, so the storefront
// never breaks. The /api/seed migration seeds these 10 into the table.
export const CATEGORIES: string[] = [
  'Kitchen & Dining',
  'Home & Living',
  'Footwear',
  'Baby & Kids Toys',
  'Home Decor',
  'Bathroom Accessories',
  'Mobile Accessories',
  'Organizers',
  'Health & Fitness',
  'Tool Kits',
];

export const MAX_CATEGORY_NAME_LENGTH = 60;

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Find a category name by its URL slug. Pass the live list from the
// database when available; defaults to the built-in list (fallback).
export function categoryFromSlug(
  slug: string,
  list: string[] = CATEGORIES,
): string | undefined {
  return list.find((c) => slugifyCategory(c) === slug);
}

// User-facing category errors (bad name, duplicate, slug clash, delete
// blocked, not found). API routes map these to 4xx; anything else is a 500.
export class CategoryInputError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'CategoryInputError';
    this.status = status;
  }
}

// Normalise + validate a category name from the owner. Returns the cleaned
// name, or an error message. Used by both the admin API (authoritative)
// and the admin form (so the owner sees the same rules).
export function validateCategoryName(raw: string): {
  name?: string;
  error?: string;
} {
  const name = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!name) return { error: 'Category name is required.' };
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return {
      error: `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or less.`,
    };
  }
  if (!slugifyCategory(name)) {
    return {
      error: 'Category name must contain at least one letter or number.',
    };
  }
  return { name };
}
