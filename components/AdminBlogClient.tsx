'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import {
  formatPostDate,
  MAX_POST_BODY_LENGTH,
  MAX_POST_EXCERPT_LENGTH,
  MAX_POST_TITLE_LENGTH,
} from '@/lib/blog';
import { compressPhoto } from '@/lib/compress-photo';
import type { BlogPost } from '@/lib/types';
import { blogImageSrc } from '@/lib/types';

type FormState = {
  title: string;
  excerpt: string;
  body: string;
  image_url: string;
};

const emptyForm: FormState = {
  title: '',
  excerpt: '',
  body: '',
  image_url: '',
};

function formFromPost(p: BlogPost): FormState {
  return {
    title: p.title,
    excerpt: p.excerpt,
    body: p.body,
    image_url: p.image_url,
  };
}

export default function AdminBlogClient({
  initialPosts,
}: {
  initialPosts: BlogPost[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  // The "or paste an image link" box under the photo upload.
  const [pasteUrl, setPasteUrl] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialPosts;
    return initialPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q),
    );
  }, [initialPosts, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setNotice('');
    setShowForm(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm(formFromPost(p));
    setPasteUrl('');
    setPhotoError('');
    setFormError('');
    setNotice('');
    setShowForm(true);
  };

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setCompressing(true);
    try {
      set('image_url', await compressPhoto(file));
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
    if (!form.title.trim()) return setFormError('Post title is required.');
    if (form.title.trim().length > MAX_POST_TITLE_LENGTH) {
      return setFormError(
        `Title must be ${MAX_POST_TITLE_LENGTH} characters or less.`,
      );
    }
    if (form.excerpt.trim().length > MAX_POST_EXCERPT_LENGTH) {
      return setFormError(
        `Summary must be ${MAX_POST_EXCERPT_LENGTH} characters or less.`,
      );
    }
    if (form.body.length > MAX_POST_BODY_LENGTH) {
      return setFormError('The article text is too long — please shorten it.');
    }
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/blog/${editing.id}` : '/api/admin/blog',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            excerpt: form.excerpt.trim(),
            body: form.body,
            image_url: form.image_url.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the post.');
      setShowForm(false);
      setNotice(
        editing
          ? `Post "${data.post.title}" updated.`
          : `Post "${data.post.title}" published on the Blog page.`,
      );
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: BlogPost) => {
    if (!window.confirm(`Delete the post "${p.title}"? This cannot be undone.`)) {
      return;
    }
    setListError('');
    setNotice('');
    const res = await fetch(`/api/admin/blog/${p.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setListError(data.error || 'Could not delete the post.');
      return;
    }
    setNotice(`Post "${p.title}" deleted.`);
    router.refresh();
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          className="input"
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-red" onClick={openAdd}>
          + New Post
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {filtered.length} post{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {listError && <div className="form-error">{listError}</div>}
      {notice && <div className="form-success">{notice}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Date</th>
              <th>Page Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.slug}>
                <td>
                  {p.image_url ? (
                    <img src={blogImageSrc(p)} alt={p.title} />
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>—</span>
                  )}
                </td>
                <td>
                  <strong>{p.title}</strong>
                  {p.excerpt && (
                    <>
                      <br />
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {p.excerpt.length > 90
                          ? `${p.excerpt.slice(0, 87).trimEnd()}…`
                          : p.excerpt}
                      </span>
                    </>
                  )}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {formatPostDate(p.created_at)}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                  /blog/{p.slug}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-navy btn-small"
                      onClick={() => openEdit(p)}
                      disabled={p.id === 0}
                      title={
                        p.id === 0
                          ? 'Open /api/seed once to enable editing'
                          : 'Edit this post'
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => remove(p)}
                      disabled={p.id === 0}
                      title={
                        p.id === 0
                          ? 'Open /api/seed once to enable deleting'
                          : 'Delete this post'
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  No posts yet — write your first one with the button above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Post' : 'New Blog Post'}</h2>
            <form onSubmit={save}>
              {formError && <div className="form-error">{formError}</div>}

              <div className="form-field">
                <label>Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={MAX_POST_TITLE_LENGTH}
                  placeholder="e.g. 5 Easy Ways to Keep Your Kitchen Tidy"
                />
                <p className="variant-hint">
                  The page address is made from the title automatically.
                </p>
              </div>

              <div className="form-field">
                <label>Summary</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  maxLength={MAX_POST_EXCERPT_LENGTH}
                  placeholder="One or two lines shown under the title on the Blog page"
                />
                <p className="variant-hint">
                  Leave empty to use the start of the article instead.
                </p>
              </div>

              <div className="form-field">
                <label>Article</label>
                <textarea
                  className="input"
                  rows={10}
                  value={form.body}
                  onChange={(e) => set('body', e.target.value)}
                  placeholder="Write the full article here — leave a blank line between paragraphs."
                />
                <p className="variant-hint">
                  Plain text is fine. A blank line starts a new paragraph on
                  the article page.
                </p>
              </div>

              <div className="form-field">
                <label>Photo</label>
                {form.image_url ? (
                  <div className="upload-row">
                    <img
                      src={form.image_url}
                      alt="Post photo"
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
                        disabled={compressing}
                      >
                        {compressing ? 'Processing…' : 'Replace Photo'}
                      </button>
                      <button
                        type="button"
                        className="btn-danger btn-small"
                        onClick={() => set('image_url', '')}
                        disabled={compressing}
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
                    disabled={compressing}
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
                  disabled={saving || compressing}
                >
                  {saving
                    ? 'Saving…'
                    : compressing
                      ? 'Processing photo…'
                      : editing
                        ? 'Save Changes'
                        : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
