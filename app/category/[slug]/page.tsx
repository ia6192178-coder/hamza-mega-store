import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { categoryFromSlug } from '@/lib/categories';
import { getCategoriesWithCounts, getProductsByCategory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const cats = await getCategoriesWithCounts();
  const category = categoryFromSlug(
    params.slug,
    cats.map((c) => c.name),
  );
  if (!category) notFound();
  const cat = cats.find((c) => c.name === category);

  const products = await getProductsByCategory(category);

  return (
    <div className="page-wrap">
      {/* v6.2: the category's own photo (set in the Admin Panel) as a banner. */}
      {cat?.image_url && (
        <img
          src={cat.image_url}
          alt=""
          data-reveal
          style={{
            width: '100%',
            height: 220,
            objectFit: 'cover',
            borderRadius: 12,
            marginBottom: 16,
            display: 'block',
          }}
        />
      )}
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
