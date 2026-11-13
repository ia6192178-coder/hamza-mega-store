'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MAX_CATEGORY_NAME_LENGTH } from '@/lib/categories';
import type { CategoryWithCount } from '@/lib/types';

export default function AdminCategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryWithCount[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    const name = newName.trim();
    if (!name) return setError('Enter a category name first.');
    if (name.length > MAX_CATEGORY_NAME_LENGTH) {
      return setError(
        `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or less.`,
      );
    }
    setAdding(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add the category.');
      setNewName('');
      setNotice(
        data.category?.existed
          ? `"${data.category.name}" already exists — it is already in the list.`
          : `Category "${data.category.name}" added.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the category.');
    } finally {
      setAdding(false);
    }
  };

  const startRename = (c: CategoryWithCount) => {
    setEditingId(c.id);
    setEditName(c.name);
    setError('');
    setNotice('');
  };

  const saveRename = async (c: CategoryWithCount) => {
    const name = editName.trim();
    if (!name) return setError('Category name cannot be empty.');
    if (name.length > MAX_CATEGORY_NAME_LENGTH) {
      return setError(
        `Category name must be ${MAX_CATEGORY_NAME_LENGTH} characters or less.`,
      );
    }
    if (name === c.name) {
      setEditingId(null);
      return;
    }
    setBusyId(c.id);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not rename the category.');
      setEditingId(null);
      setNotice(
        `Renamed to "${data.category.name}" — its products moved with it.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename the category.');
    } finally {
      setBusyId(null);
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
      <form onSubmit={add} className="admin-toolbar">
        <input
          className="input"
          placeholder="New category name — e.g. Electronics"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={MAX_CATEGORY_NAME_LENGTH}
        />
        <button type="submit" className="btn-red" disabled={adding}>
          {adding ? 'Adding…' : '+ Add Category'}
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {initialCategories.length} categor
          {initialCategories.length === 1 ? 'y' : 'ies'}
        </span>
      </form>

      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
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
                  {editingId === c.id ? (
                    <input
                      className="input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={MAX_CATEGORY_NAME_LENGTH}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void saveRename(c);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <strong>{c.name}</strong>
                  )}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                  /category/{c.slug}
                </td>
                <td>
                  {c.count} product{c.count === 1 ? '' : 's'}
                </td>
                <td>
                  {editingId === c.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-navy btn-small"
                        onClick={() => saveRename(c)}
                        disabled={busyId === c.id}
                      >
                        {busyId === c.id ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn-outline btn-small"
                        onClick={() => setEditingId(null)}
                        disabled={busyId === c.id}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-navy btn-small"
                        onClick={() => startRename(c)}
                        disabled={c.id === 0}
                        title={
                          c.id === 0
                            ? 'Open /api/seed once to enable editing'
                            : 'Rename this category'
                        }
                      >
                        Rename
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
                  )}
                </td>
              </tr>
            ))}
            {initialCategories.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>
                  No categories yet — add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
        Renaming a category also moves its products to the new name. A category
        can only be deleted when no product uses it.
      </p>
    </>
  );
}
