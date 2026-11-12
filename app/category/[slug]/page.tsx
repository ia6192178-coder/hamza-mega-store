import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { categoryFromSlug } from '@/lib/categories';
import { getProductsByCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = categoryFromSlug(params.slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category);

  return (
    <div className="page-wrap">
      <h1 className="page-title">{category}</h1>
      <p className="page-subtitle">
        {products.length} product{products.length === 1 ? '' : 's'}
      </p>

      {products.length === 0 ? (
        <div className="empty-state">
          <h3>No products in this category yet</h3>
          <p>Check back soon — new products are added regularly.</p>
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
