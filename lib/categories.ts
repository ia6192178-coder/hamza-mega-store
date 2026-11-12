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

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoryFromSlug(slug: string): string | undefined {
  return CATEGORIES.find((c) => slugifyCategory(c) === slug);
}
