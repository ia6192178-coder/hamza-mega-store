'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { MAX_CATEGORY_NAME_LENGTH } from '@/lib/categories';
import { compressPhoto } from '@/lib/compress-photo';
import type { CategoryWithCount } from '@/lib/types';

type DialogState =
  | { mode: 'add' }
  | { mode: 'edit'; category: CategoryWithCount };

export default function AdminCategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryWithCount[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [formName, setFormName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const openAdd = () => {
    setFormName('');
    setFormImageUrl('');
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setError('');
    setNotice('');
    setDialog({ mode: 'add' });
  };

  const openEdit = (c: CategoryWithCount) => {
    setFormName(c.name);
    setFormImageUrl(c.image_url || '');
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setError('');
    setNotice('');
    setDialog({ mode: 'edit', category: c });
  };

  const closeDialog = () => {
    if (saving || compressing) return;
    setDialog(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setCompressing(true);
    try {
      setFormImageUrl(await compressPhoto(file));
      setPasteUrl('');
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : 'Could not use this photo.',
      );
    } finally {
      setCompressing(false);
    }
  };

  // Fallback for owners who already have a photo hosted somewhere: paste
  // its link instead of uploading a file.
  const usePastedUrl = () => {
    const url = pasteUrl.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      setPhotoError('Paste a full image link starting with https://');
      return;
    }
    setPhotoError('');
    setFormImageUrl(url);
    setPasteUrl('');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    const name = formName.trim();
    if (!name) return setFormError('Enter a category name first.');
    if (name.length > MAX_CATEGORY_NAME_LENGTH) {
      return setFormError(
        `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or less.`,
      );
    }
    setFormError('');
    setSaving(true);
    try {
      const isEdit = dialog.mode === 'edit';
      const res = await fetch(
        isEdit
          ? `/api/admin/categories/${dialog.category.id}`
          : '/api/admin/categories',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image_url: formImageUrl }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the category.');
      setDialog(null);
      if (isEdit) {
        setNotice(`"${data.category.name}" saved — its photo and products are updated on the store.`);
      } else if (data.category?.existed) {
        setNotice(
          `"${data.category.name}" already exists — it is already in the list.`,
        );
      } else {
        setNotice(`Category "${data.category.name}" added.`);
      }
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: CategoryWithCount) => {
    if (c.count > 0) {
      setError(
        `Cannot delete "${c.name}" — ${c.count} product${c.count === 1 ? '' : 's'} still use${c.count === 1 ? 's' : ''} it. Move those products to another category first.`,
      );
      return;
    }
    if (!window.confirm(`Delete the category "${c.name}"? This cannot be undone.`)) {
      return;
    }
    setBusyId(c.id);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete the category.');
      setNotice(`Category "${c.name}" deleted.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the category.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <button type="button" className="btn-red" onClick={openAdd}>
          + Add Category
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {initialCategories.length} categor
          {initialCategories.length === 1 ? 'y' : 'ies'}
          {' — click a category to edit its name and photo.'}
        </span>
      </div>

      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Category</th>
              <th>Page Address</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialCategories.map((c) => (
              <tr key={c.id || c.name}>
                <td>
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt=""
                      width={48}
                      height={48}
                      style={{
                        objectFit: 'cover',
                        borderRadius: 6,
                        display: 'block',
                        cursor: 'pointer',
                      }}
                      onClick={() => c.id !== 0 && openEdit(c)}
                    />
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    disabled={c.id === 0}
                    title={
                      c.id === 0
                        ? 'Open /api/seed once to enable editing'
                        : 'Edit name and photo'
                    }
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: c.id === 0 ? 'default' : 'pointer',
                      font: 'inherit',
                      color: 'var(--navy)',
                      textAlign: 'left',
                    }}
                  >
                    <strong>{c.name}</strong>
                  </button>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                  /category/{c.slug}
                </td>
                <td>
                  {c.count} product{c.count === 1 ? '' : 's'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-navy btn-small"
                      onClick={() => openEdit(c)}
                      disabled={c.id === 0}
                      title={
                        c.id === 0
                          ? 'Open /api/seed once to enable editing'
                          : 'Edit name and photo'
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => remove(c)}
                      disabled={busyId === c.id || c.id === 0}
                      title={
                        c.id === 0
                          ? 'Open /api/seed once to enable deleting'
                          : c.count > 0
                            ? 'Move its products to another category first'
                            : 'Delete this category'
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialCategories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  No categories yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
        Renaming a category also moves its products to the new name. A category
        can only be deleted when no product uses it. A category&apos;s photo
        shows on its home page tile and at the top of its page.
      </p>

      {dialog && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {dialog.mode === 'edit' ? 'Edit Category' : 'New Category'}
            </h2>
            <form onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-field">
                <label>Category Name *</label>
                <input
                  className="input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  placeholder="e.g. Electronics"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                <p className="variant-hint">
                  The page address is made from the name automatically.
                </p>
              </div>

              <div className="form-field">
                <label>Photo</label>
                {formImageUrl ? (
                  <div className="upload-row">
                    <img
                      src={formImageUrl}
                      alt="Category photo"
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
                        onClick={() => fileRef.current?.click()}
                        disabled={compressing || saving}
                      >
                        {compressing ? 'Processing…' : 'Replace Photo'}
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => setFormImageUrl('')}
                        disabled={compressing || saving}
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-navy"
                    onClick={() => fileRef.current?.click()}
                    disabled={compressing || saving}
                  >
                    {compressing ? 'Processing photo…' : '📷 Upload Photo'}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFile}
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
                    onClick={usePastedUrl}
                    disabled={!pasteUrl.trim() || compressing || saving}
                  >
                    Use Link
                  </button>
                </div>
                <p className="variant-hint">
                  Photos are compressed automatically before saving, so phone
                  photos upload quickly. Without a photo, the tile shows the
                  first product&apos;s photo instead.
                </p>
                {photoError && (
                  <div className="form-error" style={{ marginTop: 8 }}>
                    {photoError}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeDialog}
                  disabled={saving || compressing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-red"
                  disabled={saving || compressing}
                >
                  {saving
                    ? 'Saving…'
                    : dialog.mode === 'edit'
                      ? 'Save Changes'
                      : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
