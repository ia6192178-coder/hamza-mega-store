import { revalidatePath } from 'next/cache';

// Purge every cached storefront page after an admin change (a category or
// product added, renamed, edited or deleted), so customers see the change
// immediately — home page tiles, the header/footer category lists, the
// category pages and search. The root layout (header + footer) is shared
// by every page, so purging it purges all pages that use it. Call after a
// successful admin write, before returning the response.
export function revalidateStorefront(): void {
  revalidatePath('/', 'layout');
}
