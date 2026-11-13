'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import type { Product } from '@/lib/types';
import {
  formatRs,
  MAX_EXTRA_IMAGES,
  productHasVariants,
  productTotalStock,
} from '@/lib/types';

type FormState = {
  name: string;
  category: string;
  price: string;
  old_price: string;
  description: string;
  image_url: string;
  stock: string;
  rating: string;
  is_new: boolean;
  is_best_seller: boolean;
  is_clearance: boolean;
  is_sold_out: boolean;
  // Option name for variants (e.g. 'Size', 'Color', 'Weight'). Empty means
  // a simple product with one price and one stock.
  variant_label: string;
};

// One editable variant row in the form (all strings, parsed on save).
type VariantRow = {
  label: string;
  price: string;
  old_price: string;
  stock: string;
};

const emptyVariantRow = (): VariantRow => ({
  label: '',
  price: '',
  old_price: '',
  stock: '10',
});

const emptyForm: FormState = {
  name: '',
  category: CATEGORIES[0],
  price: '',
  old_price: '',
  description: '',
  image_url: '',
  stock: '10',
  rating: '4.5',
  is_new: false,
  is_best_seller: false,
  is_clearance: false,
  is_sold_out: false,
  variant_label: '',
};

function formFromProduct(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    price: String(p.price),
    old_price: p.old_price ? String(p.old_price) : '',
    description: p.description,
    image_url: p.image_url,
    stock: String(p.stock),
    rating: String(p.rating),
    is_new: p.is_new,
    is_best_seller: p.is_best_seller,
    is_clearance: p.is_clearance,
    is_sold_out: p.is_sold_out,
    variant_label: p.variant_label ?? '',
  };
}

function rowsFromProduct(p: Product): VariantRow[] {
  if (!productHasVariants(p)) return [];
  return (p.variants ?? []).map((v) => ({
    label: v.label,
    price: String(v.price),
    old_price: v.old_price ? String(v.old_price) : '',
    stock: String(v.stock),
  }));
}

// ---------- Client-side photo compression ----------
// Phone photos are 2–5MB — far too big to send to the server as-is (Vercel
// rejects requests over 4.5MB, and uploads crawl on a slow connection).
// Every photo is resized in the browser before saving: max 1200px on the
// long edge, JPEG quality 0.82 — usually 100–200KB. If the result is still
// over ~1MB, one smaller/lower-quality retry runs before giving up.

const MAX_PHOTO_EDGE = 1200;
const MAX_PHOTO_BYTES = 1_000_000;

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. Please try another file.'));
    };
    img.src = url;
  });
}

function renderJpeg(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number,
): string {
  const scale = Math.min(
    1,
    maxEdge / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot process photos.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

// Approximate binary size of a data URL (base64 is ~4/3 of the binary).
function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor(base64.length * 0.75);
}

async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG or PNG).');
  }
  const img = await loadImageFile(file);
  const first = renderJpeg(img, MAX_PHOTO_EDGE, 0.82);
  if (dataUrlBytes(first) <= MAX_PHOTO_BYTES) return first;
  const retry = renderJpeg(img, 900, 0.7);
  if (dataUrlBytes(retry) <= MAX_PHOTO_BYTES) return retry;
  throw new Error(
    'This photo is still too large after compression — please choose a smaller photo.',
  );
}

export default function AdminProductsClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  // Extra photos (up to MAX_EXTRA_IMAGES). Each entry is a data URL (fresh
  // upload), a remote URL (pasted link) or a /api/image URL (an untouched
  // stored photo — the server resolves those back on save).
  const [gallery, setGallery] = useState<string[]>([]);
  // The "or paste an image link" box under the main photo upload.
  const [pasteUrl, setPasteUrl] = useState('');
  // 'main' | 'gallery' while a photo is being compressed, '' otherwise.
  const [compressing, setCompressing] = useState('');
  const [photoError, setPhotoError] = useState('');
  const mainFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialProducts.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [initialProducts, search, category]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setVariantRows([]);
    setGallery([]);
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm(formFromProduct(p));
    setVariantRows(rowsFromProduct(p));
    setGallery(p.gallery ?? []);
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setShowForm(true);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setVariantRow = (index: number, key: keyof VariantRow, value: string) =>
    setVariantRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );

  const addVariantRow = () => setVariantRows((rows) => [...rows, emptyVariantRow()]);

  const removeVariantRow = (index: number) =>
    setVariantRows((rows) => rows.filter((_, i) => i !== index));

  const handleMainFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setCompressing('main');
    try {
      set('image_url', await compressPhoto(file));
      setPasteUrl('');
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Could not use this photo.',
      );
    } finally {
      setCompressing('');
    }
  };

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setCompressing('gallery');
    try {
      const dataUrl = await compressPhoto(file);
      setGallery((g) =>
        g.length >= MAX_EXTRA_IMAGES ? g : [...g, dataUrl],
      );
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Could not use this photo.',
      );
    } finally {
      setCompressing('');
    }
  };

  // Fallback for owners who already have a photo hosted somewhere: paste
  // its link instead of uploading a file.
  const usePastedMainUrl = () => {
    const url = pasteUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setPhotoError('Please paste a full image link starting with https://');
      return;
    }
    setPhotoError('');
    set('image_url', url);
    setPasteUrl('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (compressing) {
      setFormError('Please wait for the photo to finish processing.');
      return;
    }
    const price = Number(form.price);
    const oldPrice = form.old_price.trim() ? Number(form.old_price) : null;
    const stock = Number(form.stock);
    const rating = Number(form.rating);
    if (!form.name.trim()) return setFormError('Product name is required.');
    if (!Number.isFinite(price) || price <= 0)
      return setFormError('Enter a valid price.');
    if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
      return setFormError('Old price must be a number, or leave it empty.');
    if (!Number.isFinite(stock) || stock < 0)
      return setFormError('Stock must be 0 or more.');
    if (!Number.isFinite(rating) || rating < 0 || rating > 5)
      return setFormError('Rating must be between 0 and 5.');

    // Variants: an option name with no rows (or invalid rows) is an error.
    // Without an option name the product stays simple — rows are ignored.
    const variantLabel = form.variant_label.trim();
    const variants: { label: string; price: number; old_price: number | null; stock: number }[] = [];
    if (variantLabel) {
      const filled = variantRows.filter(
        (r) => r.label.trim() || r.price.trim(),
      );
      if (filled.length === 0)
        return setFormError(
          'You set an option name — add at least one variant row, or clear the option name.',
        );
      for (const r of filled) {
        const label = r.label.trim();
        const vPrice = Number(r.price);
        const vOld = r.old_price.trim() ? Number(r.old_price) : null;
        const vStock = Number(r.stock);
        if (!label) return setFormError('Every variant needs a value (e.g. UK 9).');
        if (!Number.isFinite(vPrice) || vPrice <= 0)
          return setFormError(`Variant "${label}" needs a price greater than 0.`);
        if (vOld !== null && (!Number.isFinite(vOld) || vOld < 0))
          return setFormError(`Variant "${label}" has an invalid old price.`);
        if (!Number.isFinite(vStock) || vStock < 0)
          return setFormError(`Variant "${label}" needs stock of 0 or more.`);
        variants.push({ label, price: vPrice, old_price: vOld, stock: vStock });
      }
    }

    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : '/api/admin/products',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            category: form.category,
            price,
            old_price: oldPrice,
            description: form.description.trim(),
            image_url: form.image_url.trim(),
            gallery,
            stock,
            rating,
            is_new: form.is_new,
            is_best_seller: form.is_best_seller,
            is_clearance: form.is_clearance,
            is_sold_out: form.is_sold_out,
            variant_label: variantLabel || null,
            variants,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the product.');
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setListError('');
    const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setListError(data.error || 'Could not delete the product.');
      return;
    }
    router.refresh();
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="input"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn-red" onClick={openAdd}>
          + Add Product
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {filtered.length} product(s)
        </span>
      </div>

      {listError && <div className="form-error">{listError}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} />
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <br />
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    ★ {Number(p.rating).toFixed(1)}
                  </span>
                  {productHasVariants(p) && (
                    <>
                      <br />
                      <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 700 }}>
                        {p.variant_label ?? 'Option'}: {p.variants!.length} option
                        {p.variants!.length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </td>
                <td>{p.category}</td>
                <td>
                  <strong>
                    {productHasVariants(p) ? 'From ' : ''}
                    {formatRs(
                      productHasVariants(p)
                        ? Math.min(...p.variants!.map((v) => v.price))
                        : p.price,
                    )}
                  </strong>
                  {!productHasVariants(p) &&
                    p.old_price &&
                    p.old_price > p.price && (
                    <>
                      <br />
                      <span
                        style={{
                          color: 'var(--muted)',
                          fontSize: 12,
                          textDecoration: 'line-through',
                        }}
                      >
                        {formatRs(p.old_price)}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  {productTotalStock(p)}
                  {productHasVariants(p) && (
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {' '}
                      (total)
                    </span>
                  )}
                </td>
                <td style={{ fontSize: 12 }}>
                  {[
                    p.is_new && 'NEW',
                    p.is_best_seller && 'BEST',
                    p.is_clearance && 'CLEARANCE',
                    p.is_sold_out && 'SOLD OUT',
                  ]
                    .filter(Boolean)
                    .join(' • ') || '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-navy btn-small"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-field">
                <label>Product Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Non-Stick Frying Pan 28cm"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Category *</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Rating (0 – 5)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => set('rating', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Price (Rs) *</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="1899"
                  />
                </div>
                <div className="form-field">
                  <label>Old Price (Rs) — for discount badge</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={form.old_price}
                    onChange={(e) => set('old_price', e.target.value)}
                    placeholder="Leave empty if no discount"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Main Photo</label>
                {form.image_url ? (
                  <div className="upload-row">
                    <img
                      src={form.image_url}
                      alt="Main product photo"
                      className="upload-preview"
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-outline btn-small"
                        onClick={() => mainFileRef.current?.click()}
                        disabled={compressing !== ''}
                      >
                        {compressing === 'main'
                          ? 'Processing…'
                          : 'Replace Photo'}
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => set('image_url', '')}
                        disabled={compressing !== ''}
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-navy"
                    onClick={() => mainFileRef.current?.click()}
                    disabled={compressing !== ''}
                  >
                    {compressing === 'main'
                      ? 'Processing photo…'
                      : '📷 Upload Main Photo'}
                  </button>
                )}
                <input
                  ref={mainFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleMainFile}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input
                    className="input"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    placeholder="…or paste an image link (https://)"
                  />
                  <button
                    type="button"
                    className="btn-outline btn-small"
                    onClick={usePastedMainUrl}
                    disabled={!pasteUrl.trim()}
                  >
                    Use Link
                  </button>
                </div>
                <p className="variant-hint">
                  Photos are compressed automatically before saving, so phone
                  photos upload quickly.
                </p>
                {photoError && (
                  <div className="form-error" style={{ marginTop: 8 }}>
                    {photoError}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>
                  Extra Photos (optional) — up to {MAX_EXTRA_IMAGES}
                </label>
                <div className="gallery-slots">
                  {gallery.map((src, i) => (
                    <div key={i} className="gallery-slot">
                      <img src={src} alt={`Extra photo ${i + 1}`} />
                      <button
                        type="button"
                        className="gallery-slot-remove"
                        onClick={() =>
                          setGallery((g) => g.filter((_, j) => j !== i))
                        }
                        aria-label={`Remove extra photo ${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {gallery.length < MAX_EXTRA_IMAGES && (
                    <button
                      type="button"
                      className="upload-add"
                      onClick={() => galleryFileRef.current?.click()}
                      disabled={compressing !== ''}
                      aria-label="Add an extra photo"
                    >
                      {compressing === 'gallery' ? '…' : '＋'}
                    </button>
                  )}
                </div>
                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleGalleryFile}
                />
                <p className="variant-hint">
                  Extra photos appear as thumbnails on the product page —
                  customers tap them to view.
                </p>
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Short description shown on the product page"
                />
              </div>

              <div className="form-field">
                <label>Stock Quantity</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
              </div>

              <div className="form-field variant-section">
                <label>Variant Option Name (optional)</label>
                <input
                  className="input"
                  value={form.variant_label}
                  onChange={(e) => set('variant_label', e.target.value)}
                  placeholder="e.g. Size, Color or Weight — leave empty for a simple product"
                />
                <p className="variant-hint">
                  For products sold in options — shoe sizes, colours, weights.
                  Each option gets its own price and stock, and customers pick
                  one on the product page. The Price above is used only when
                  there are no variants.
                </p>
              </div>

              {form.variant_label.trim() && (
                <div className="form-field">
                  <label>
                    Variants — {form.variant_label.trim()} options
                  </label>
                  <div className="variant-rows-head">
                    <span>Value *</span>
                    <span>Price (Rs) *</span>
                    <span>Old Price</span>
                    <span>Stock</span>
                    <span />
                  </div>
                  {variantRows.map((row, i) => (
                    <div key={i} className="variant-row">
                      <input
                        className="input"
                        value={row.label}
                        onChange={(e) =>
                          setVariantRow(i, 'label', e.target.value)
                        }
                        placeholder="e.g. UK 9"
                      />
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={row.price}
                        onChange={(e) =>
                          setVariantRow(i, 'price', e.target.value)
                        }
                        placeholder="3599"
                      />
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={row.old_price}
                        onChange={(e) =>
                          setVariantRow(i, 'old_price', e.target.value)
                        }
                        placeholder="—"
                      />
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={(e) =>
                          setVariantRow(i, 'stock', e.target.value)
                        }
                        placeholder="10"
                      />
                      <button
                        type="button"
                        className="variant-remove"
                        onClick={() => removeVariantRow(i)}
                        aria-label="Remove this variant"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-outline btn-small"
                    onClick={addVariantRow}
                    style={{ marginTop: 8 }}
                  >
                    + Add Variant
                  </button>
                </div>
              )}

              <div className="checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => set('is_new', e.target.checked)}
                  />
                  New Arrival
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.is_best_seller}
                    onChange={(e) => set('is_best_seller', e.target.checked)}
                  />
                  Best Seller
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.is_clearance}
                    onChange={(e) => set('is_clearance', e.target.checked)}
                  />
                  Clearance Sale
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.is_sold_out}
                    onChange={(e) => set('is_sold_out', e.target.checked)}
                  />
                  Sold Out
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-red"
                  disabled={saving || compressing !== ''}
                >
                  {saving
                    ? 'Saving…'
                    : compressing !== ''
                      ? 'Processing photo…'
                      : editing
                        ? 'Save Changes'
                        : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
