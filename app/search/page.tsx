import ProductCard from '@/components/ProductCard';
import { getProducts, searchProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || '').trim();
  const products = q ? await searchProducts(q) : await getProducts();

  return (
    <div className="page-wrap">
      <h1 className="page-title">
        {q ? `Search results for “${q}”` : 'All Products'}
      </h1>
      <p className="page-subtitle">
        {products.length} product{products.length === 1 ? '' : 's'} found
      </p>

      {products.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>
            Try a different search word, or browse the categories from the menu
            above.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
