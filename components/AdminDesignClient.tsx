'use client';

import { useRef, useState } from 'react';
import {
  BLOCK_TYPES,
  BUILTIN_SECTIONS,
  MAX_BLOCKS,
  MAX_HERO_SLIDES,
  blockLabel,
  isHexColor,
  type Design,
  type DesignFooter,
  type DesignHero,
  type DesignTheme,
  type HomeLayoutItem,
} from '@/lib/design';
import { compressPhoto } from '@/lib/compress-photo';
import type {
  DesignBlock,
  DesignBlockContent,
  DesignBlockType,
} from '@/lib/types';

type DialogState =
  | { mode: 'add' }
  | { mode: 'edit'; block: DesignBlock };

const EMPTY_HERO_SLIDE = {
  image: '',
  title: '',
  subtitle: '',
  button_text: '',
  button_link: '',
};

export default function AdminDesignClient({
  initialDesign,
  initialBlocks,
  initialAnnouncement,
}: {
  initialDesign: Design;
  initialBlocks: DesignBlock[];
  initialAnnouncement: string;
}) {
  const [theme, setTheme] = useState<DesignTheme>(initialDesign.theme);
  const [hero, setHero] = useState<DesignHero>(initialDesign.hero);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [announcementVisible, setAnnouncementVisible] = useState(
    initialDesign.header.announcement_visible,
  );
  const [footer, setFooter] = useState<DesignFooter>(initialDesign.footer);
  const [layout, setLayout] = useState<HomeLayoutItem[]>(initialDesign.layout);
  const [blocks, setBlocks] = useState<DesignBlock[]>(initialBlocks);

  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Hero slide photo upload (one hidden file input, shared by all slides).
  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const [heroUploadIndex, setHeroUploadIndex] = useState(0);
  const [heroCompressing, setHeroCompressing] = useState(false);
  const [heroPhotoError, setHeroPhotoError] = useState('');
  const [heroPaste, setHeroPaste] = useState<Record<number, string>>({});

  // Block dialog.
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [bType, setBType] = useState<DesignBlockType>('text');
  const [bTitle, setBTitle] = useState('');
  const [bVisible, setBVisible] = useState(true);
  const [bHeading, setBHeading] = useState('');
  const [bBody, setBBody] = useState('');
  const [bImage, setBImage] = useState('');
  const [bLink, setBLink] = useState('');
  const [bCaption, setBCaption] = useState('');
  const [bSubtext, setBSubtext] = useState('');
  const [bButtonText, setBButtonText] = useState('');
  const [bButtonLink, setBButtonLink] = useState('');
  const [bText, setBText] = useState('');
  const [bBgColor, setBBgColor] = useState('#c8102e');
  const [bPasteUrl, setBPasteUrl] = useState('');
  const [bCompressing, setBCompressing] = useState(false);
  const [bPhotoError, setBPhotoError] = useState('');
  const [bFormError, setBFormError] = useState('');
  const [bSaving, setBSaving] = useState(false);
  const blockFileRef = useRef<HTMLInputElement | null>(null);
  const [busyBlockId, setBusyBlockId] = useState<number | null>(null);

  const flash = (message: string) => {
    setError('');
    setNotice(message);
  };

  const fail = (message: string) => {
    setNotice('');
    setError(message);
  };

  async function putDesign(body: Record<string, unknown>): Promise<void> {
    const res = await fetch('/api/admin/design', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not save the design.');
  }

  // ---------- Theme ----------

  const saveTheme = async () => {
    for (const [key, label] of [
      ['primary', 'Primary colour'],
      ['accent', 'Accent colour'],
      ['header_bg', 'Header colour'],
      ['button_bg', 'Button colour'],
    ] as const) {
      if (!isHexColor(theme[key])) {
        fail(`${label} must be a colour like #0a1633.`);
        return;
      }
    }
    setSaving('theme');
    try {
      await putDesign({ theme });
      flash('Theme saved — the new colours are live on the store.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not save the theme.');
    } finally {
      setSaving(null);
    }
  };

  // ---------- Header ----------

  const saveHeader = async () => {
    setSaving('header');
    try {
      await putDesign({
        header: { announcement_visible: announcementVisible },
        announcement: announcement.trim(),
      });
      flash('Header saved — the announcement bar is updated on the store.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not save the header.');
    } finally {
      setSaving(null);
    }
  };

  // ---------- Hero ----------

  const updateSlide = (index: number, patch: Partial<typeof EMPTY_HERO_SLIDE>) => {
    setHero((h) => ({
      ...h,
      slides: h.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const addSlide = () => {
    if (hero.slides.length >= MAX_HERO_SLIDES) return;
    setHero((h) => ({ ...h, slides: [...h.slides, { ...EMPTY_HERO_SLIDE }] }));
  };

  const removeSlide = (index: number) => {
    if (hero.slides.length <= 1) {
      fail('The hero banner needs at least one slide.');
      return;
    }
    setHero((h) => ({
      ...h,
      slides: h.slides.filter((_, i) => i !== index),
    }));
  };

  const handleHeroFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setHeroPhotoError('');
    setHeroCompressing(true);
    try {
      const dataUrl = await compressPhoto(file);
      updateSlide(heroUploadIndex, { image: dataUrl });
      setHeroPaste((p) => ({ ...p, [heroUploadIndex]: '' }));
    } catch (err) {
      setHeroPhotoError(
        err instanceof Error ? err.message : 'Could not use this photo.',
      );
    } finally {
      setHeroCompressing(false);
    }
  };

  const useHeroPastedUrl = (index: number) => {
    const url = (heroPaste[index] ?? '').trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      setHeroPhotoError('Paste a full image link starting with https://');
      return;
    }
    setHeroPhotoError('');
    updateSlide(index, { image: url });
    setHeroPaste((p) => ({ ...p, [index]: '' }));
  };

  const saveHero = async () => {
    for (let i = 0; i < hero.slides.length; i++) {
      if (!hero.slides[i].title.trim()) {
        fail(`Hero slide ${i + 1} needs a title.`);
        return;
      }
    }
    setSaving('hero');
    try {
      await putDesign({ hero });
      flash('Hero banner saved — it is live on the store.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not save the hero banner.');
    } finally {
      setSaving(null);
    }
  };

  // ---------- Home page layout ----------

  const moveLayout = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= layout.length) return;
    setLayout((items) => {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleLayoutItem = (index: number) => {
    const item = layout[index];
    if (item.kind === 'section') {
      // The hero's visibility lives in the hero settings (one source of
      // truth, shared with the Hero section above); other sections keep
      // theirs in the layout item.
      if (item.key === 'hero') {
        setHero((h) => ({ ...h, visible: !h.visible }));
        return;
      }
      setLayout((items) =>
        items.map((it, i) =>
          i === index && it.kind === 'section'
            ? { ...it, visible: !it.visible }
            : it,
        ),
      );
      return;
    }
    const block = blocks.find((b) => b.id === item.id);
    if (block) void toggleBlockVisible(block);
  };

  const saveLayout = async () => {
    setSaving('layout');
    try {
      // The hero's visibility can change from this list too, so it is
      // saved together with the layout.
      await putDesign({ layout, hero });
      flash('Home page layout saved — the store shows the new order.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not save the layout.');
    } finally {
      setSaving(null);
    }
  };

  const layoutRowInfo = (item: HomeLayoutItem): {
    label: string;
    badge: string;
    isBlock: boolean;
    visible: boolean;
  } => {
    if (item.kind === 'section') {
      const found = BUILTIN_SECTIONS.find((s) => s.key === item.key);
      return {
        label: found ? found.label : item.key,
        badge: 'Section',
        isBlock: false,
        visible: item.key === 'hero' ? hero.visible : item.visible,
      };
    }
    const block = blocks.find((b) => b.id === item.id);
    return {
      label: block ? blockLabel(block) : 'Deleted block',
      badge: block ? `Block • ${block.type}` : 'Block',
      isBlock: true,
      visible: block ? block.visible : false,
    };
  };

  // ---------- Footer ----------

  const saveFooter = async () => {
    setSaving('footer');
    try {
      await putDesign({ footer });
      flash('Footer saved — it is live on the store.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not save the footer.');
    } finally {
      setSaving(null);
    }
  };

  // ---------- Reset ----------

  const resetDesign = async () => {
    if (
      !window.confirm(
        'Restore the built-in design? Colours, hero banner, header and footer go back to their defaults and the home page order is reset. Your custom blocks are kept — they move to the end of the home page.',
      )
    ) {
      return;
    }
    setSaving('reset');
    try {
      const res = await fetch('/api/admin/design/reset', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset the design.');
      // Reload the whole design from the server so the editor shows the
      // restored defaults.
      const fresh = await fetch('/api/admin/design');
      const freshData = await fresh.json();
      if (!fresh.ok) throw new Error('Design reset, but the editor could not reload — please refresh the page.');
      const d = freshData.design as Design;
      setTheme(d.theme);
      setHero(d.hero);
      setAnnouncementVisible(d.header.announcement_visible);
      setFooter(d.footer);
      setLayout(d.layout);
      setBlocks(freshData.blocks as DesignBlock[]);
      if (typeof freshData.announcement === 'string') {
        setAnnouncement(freshData.announcement);
      }
      flash('Design restored to the built-in defaults. Your custom blocks were kept.');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not reset the design.');
    } finally {
      setSaving(null);
    }
  };

  // ---------- Blocks ----------

  const openAddBlock = () => {
    setBType('text');
    setBTitle('');
    setBVisible(true);
    setBHeading('');
    setBBody('');
    setBImage('');
    setBLink('');
    setBCaption('');
    setBSubtext('');
    setBButtonText('');
    setBButtonLink('');
    setBText('');
    setBBgColor('#c8102e');
    setBPasteUrl('');
    setBPhotoError('');
    setBFormError('');
    setDialog({ mode: 'add' });
  };

  const openEditBlock = (block: DesignBlock) => {
    const c = block.content;
    setBType(block.type);
    setBTitle(block.title);
    setBVisible(block.visible);
    setBHeading(c.heading ?? '');
    setBBody(c.body ?? '');
    setBImage(c.image ?? '');
    setBLink(c.link ?? '');
    setBCaption(c.caption ?? '');
    setBSubtext(c.subtext ?? '');
    setBButtonText(c.button_text ?? '');
    setBButtonLink(c.button_link ?? '');
    setBText(c.text ?? '');
    setBBgColor(c.bg_color ?? '#c8102e');
    setBPasteUrl('');
    setBPhotoError('');
    setBFormError('');
    setDialog({ mode: 'edit', block });
  };

  const closeDialog = () => {
    if (bSaving || bCompressing) return;
    setDialog(null);
  };

  const handleBlockFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBPhotoError('');
    setBCompressing(true);
    try {
      setBImage(await compressPhoto(file));
      setBPasteUrl('');
    } catch (err) {
      setBPhotoError(
        err instanceof Error ? err.message : 'Could not use this photo.',
      );
    } finally {
      setBCompressing(false);
    }
  };

  const useBlockPastedUrl = () => {
    const url = bPasteUrl.trim();
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      setBPhotoError('Paste a full image link starting with https://');
      return;
    }
    setBPhotoError('');
    setBImage(url);
    setBPasteUrl('');
  };

  const blockContentFromForm = (): DesignBlockContent => {
    switch (bType) {
      case 'text':
        return { heading: bHeading.trim(), body: bBody.trim() };
      case 'image':
        return {
          image: bImage.trim(),
          link: bLink.trim(),
          caption: bCaption.trim(),
        };
      case 'banner':
        return {
          image: bImage.trim(),
          heading: bHeading.trim(),
          subtext: bSubtext.trim(),
          button_text: bButtonText.trim(),
          button_link: bButtonLink.trim(),
        };
      case 'promo':
        return { text: bText.trim(), bg_color: bBgColor.trim() };
    }
  };

  const saveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialog) return;
    if (bType === 'text' && !bHeading.trim() && !bBody.trim()) {
      setBFormError('A text block needs a heading or some text.');
      return;
    }
    if ((bType === 'image' || bType === 'banner') && !bImage.trim()) {
      setBFormError('This block needs a photo — upload one or paste a link.');
      return;
    }
    if (bType === 'banner' && !bHeading.trim()) {
      setBFormError('A banner block needs a headline.');
      return;
    }
    if (bType === 'promo' && !bText.trim()) {
      setBFormError('A promo strip needs its message text.');
      return;
    }
    if (bType === 'promo' && bBgColor.trim() && !isHexColor(bBgColor.trim())) {
      setBFormError('Promo strip colour must be like #c8102e.');
      return;
    }
    setBFormError('');
    setBSaving(true);
    try {
      const isEdit = dialog.mode === 'edit';
      const res = await fetch(
        isEdit
          ? `/api/admin/design/blocks/${dialog.block.id}`
          : '/api/admin/design/blocks',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: bType,
            title: bTitle.trim(),
            content: blockContentFromForm(),
            visible: bVisible,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the block.');
      setDialog(null);
      if (isEdit) {
        setBlocks((list) =>
          list.map((b) => (b.id === data.block.id ? (data.block as DesignBlock) : b)),
        );
        flash('Block saved — it is updated on the store.');
      } else {
        setBlocks((list) => [...list, data.block as DesignBlock]);
        // A new block is added to the end of the home page layout by the
        // server — take the updated layout it returns.
        if (Array.isArray(data.layout)) setLayout(data.layout);
        flash('Block added at the end of the home page — move it up in the Home Page Layout list if you like.');
      }
    } catch (err) {
      setBFormError(err instanceof Error ? err.message : 'Could not save the block.');
    } finally {
      setBSaving(false);
    }
  };

  const toggleBlockVisible = async (block: DesignBlock) => {
    setBusyBlockId(block.id);
    try {
      const res = await fetch(`/api/admin/design/blocks/${block.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: block.type,
          title: block.title,
          content: block.content,
          visible: !block.visible,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update the block.');
      setBlocks((list) =>
        list.map((b) => (b.id === block.id ? (data.block as DesignBlock) : b)),
      );
      setNotice(
        data.block.visible
          ? `Block "${blockLabel(block)}" is now shown on the store.`
          : `Block "${blockLabel(block)}" is now hidden from the store.`,
      );
      setError('');
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not update the block.');
    } finally {
      setBusyBlockId(null);
    }
  };

  const deleteBlock = async (block: DesignBlock) => {
    if (
      !window.confirm(
        `Delete the block "${blockLabel(block)}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusyBlockId(block.id);
    try {
      const res = await fetch(`/api/admin/design/blocks/${block.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete the block.');
      setBlocks((list) => list.filter((b) => b.id !== block.id));
      if (Array.isArray(data.layout)) setLayout(data.layout);
      flash(`Block "${blockLabel(block)}" deleted.`);
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Could not delete the block.');
    } finally {
      setBusyBlockId(null);
    }
  };

  const colorField = (
    key: keyof DesignTheme,
    label: string,
    hint: string,
  ) => (
    <div className="color-row" key={key}>
      <label>
        {label}
        <small>{hint}</small>
      </label>
      <input
        type="color"
        value={isHexColor(theme[key]) ? theme[key] : '#000000'}
        onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
        aria-label={label}
      />
      <input
        className="input"
        type="text"
        value={theme[key]}
        maxLength={7}
        onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
        aria-label={`${label} hex code`}
      />
    </div>
  );

  const blockImageField = () => (
    <div className="form-field">
      <label>Photo *</label>
      {bImage ? (
        <div className="upload-row">
          <img src={bImage} alt="Block photo" className="upload-preview" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn-outline btn-small"
              onClick={() => blockFileRef.current?.click()}
              disabled={bCompressing || bSaving}
            >
              {bCompressing ? 'Processing…' : 'Replace Photo'}
            </button>
            <button
              type="button"
              className="btn-danger btn-small"
              onClick={() => setBImage('')}
              disabled={bCompressing || bSaving}
            >
              Remove Photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-navy"
          onClick={() => blockFileRef.current?.click()}
          disabled={bCompressing || bSaving}
        >
          {bCompressing ? 'Processing photo…' : '📷 Upload Photo'}
        </button>
      )}
      <input
        ref={blockFileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleBlockFile}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          className="input"
          value={bPasteUrl}
          onChange={(e) => setBPasteUrl(e.target.value)}
          placeholder="…or paste an image link (https://)"
        />
        <button
          type="button"
          className="btn-outline btn-small"
          onClick={useBlockPastedUrl}
          disabled={!bPasteUrl.trim() || bCompressing || bSaving}
        >
          Use Link
        </button>
      </div>
      <p className="variant-hint">
        Photos are compressed automatically before saving, so phone photos
        upload quickly.
      </p>
      {bPhotoError && (
        <div className="form-error" style={{ marginTop: 8 }}>
          {bPhotoError}
        </div>
      )}
    </div>
  );

  return (
    <>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      {/* ---------- Theme ---------- */}
      <div className="design-card">
        <h2>🎨 Theme Colours</h2>
        <p className="design-card-hint">
          The colours of the whole store — header, buttons, prices and
          badges follow these. Pick a colour, or type its hex code.
        </p>
        {colorField('primary', 'Primary colour', 'Header, footer, section titles, navy buttons')}
        {colorField('accent', 'Accent colour', 'Announcement bar, prices, badges, links')}
        {colorField('header_bg', 'Header background', 'The top bar with the logo and search')}
        {colorField('button_bg', 'Button colour', 'Red buttons: Buy Now, hero button, Add Category')}
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-red"
            onClick={saveTheme}
            disabled={saving !== null}
          >
            {saving === 'theme' ? 'Saving…' : 'Save Theme'}
          </button>
        </div>
      </div>

      {/* ---------- Header ---------- */}
      <div className="design-card">
        <h2>📣 Header &amp; Announcement Bar</h2>
        <p className="design-card-hint">
          The scrolling message at the very top of every page. It moves
          right to left on its own — you only write the text.
        </p>
        <div className="form-field">
          <label>Announcement text</label>
          <input
            className="input"
            value={announcement}
            maxLength={200}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="e.g. Free delivery on orders over Rs 7,000"
          />
        </div>
        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={announcementVisible}
              onChange={(e) => setAnnouncementVisible(e.target.checked)}
            />
            Show the announcement bar
          </label>
        </div>
        <button
          type="button"
          className="btn-red"
          onClick={saveHeader}
          disabled={saving !== null}
        >
          {saving === 'header' ? 'Saving…' : 'Save Header'}
        </button>
      </div>

      {/* ---------- Hero ---------- */}
      <div className="design-card">
        <h2>🖼️ Hero Banner</h2>
        <p className="design-card-hint">
          The big slideshow at the top of the home page. Each slide has its
          own photo, headline and button. One slide shows as a single
          banner; several slides rotate automatically.
        </p>
        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={hero.visible}
              onChange={(e) => setHero((h) => ({ ...h, visible: e.target.checked }))}
            />
            Show the hero banner on the home page
          </label>
        </div>

        <input
          ref={heroFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleHeroFile}
        />
        {hero.slides.map((slide, i) => (
          <div className="slide-card" key={i}>
            <div className="slide-card-head">
              <strong>Slide {i + 1}</strong>
              {hero.slides.length > 1 && (
                <button
                  type="button"
                  className="btn-danger btn-small"
                  onClick={() => removeSlide(i)}
                  disabled={saving !== null}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-field">
              <label>Photo</label>
              {slide.image ? (
                <div className="upload-row">
                  <img src={slide.image} alt="" className="upload-preview" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-outline btn-small"
                      onClick={() => {
                        setHeroUploadIndex(i);
                        heroFileRef.current?.click();
                      }}
                      disabled={heroCompressing || saving !== null}
                    >
                      {heroCompressing && heroUploadIndex === i
                        ? 'Processing…'
                        : 'Replace Photo'}
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      onClick={() => updateSlide(i, { image: '' })}
                      disabled={heroCompressing || saving !== null}
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-navy"
                  onClick={() => {
                    setHeroUploadIndex(i);
                    heroFileRef.current?.click();
                  }}
                  disabled={heroCompressing || saving !== null}
                >
                  {heroCompressing && heroUploadIndex === i
                    ? 'Processing photo…'
                    : '📷 Upload Photo'}
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  className="input"
                  value={heroPaste[i] ?? ''}
                  onChange={(e) =>
                    setHeroPaste((p) => ({ ...p, [i]: e.target.value }))
                  }
                  placeholder="…or paste an image link (https://)"
                />
                <button
                  type="button"
                  className="btn-outline btn-small"
                  onClick={() => useHeroPastedUrl(i)}
                  disabled={!(heroPaste[i] ?? '').trim() || heroCompressing || saving !== null}
                >
                  Use Link
                </button>
              </div>
            </div>
            <div className="form-field">
              <label>Headline *</label>
              <input
                className="input"
                value={slide.title}
                maxLength={100}
                onChange={(e) => updateSlide(i, { title: e.target.value })}
                placeholder="e.g. Mega Sale — Up to 45% Off"
              />
            </div>
            <div className="form-field">
              <label>Subtext</label>
              <input
                className="input"
                value={slide.subtitle}
                maxLength={200}
                onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
                placeholder="e.g. Kitchen, home, fashion & more."
              />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Button text</label>
                <input
                  className="input"
                  value={slide.button_text}
                  maxLength={40}
                  onChange={(e) => updateSlide(i, { button_text: e.target.value })}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div className="form-field">
                <label>Button link</label>
                <input
                  className="input"
                  value={slide.button_link}
                  maxLength={500}
                  onChange={(e) => updateSlide(i, { button_link: e.target.value })}
                  placeholder="e.g. /#best-sellers"
                />
              </div>
            </div>
          </div>
        ))}
        {heroPhotoError && <div className="form-error">{heroPhotoError}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={addSlide}
            disabled={hero.slides.length >= MAX_HERO_SLIDES || saving !== null}
          >
            + Add Slide
          </button>
          <button
            type="button"
            className="btn-red"
            onClick={saveHero}
            disabled={saving !== null || heroCompressing}
          >
            {saving === 'hero' ? 'Saving…' : 'Save Hero Banner'}
          </button>
        </div>
      </div>

      {/* ---------- Home page layout ---------- */}
      <div className="design-card">
        <h2>🧩 Home Page Layout</h2>
        <p className="design-card-hint">
          The order of everything on the home page, top to bottom. Use the
          arrows to move a row, and the eye to show or hide it. Your custom
          blocks appear here too — new blocks are added at the end.
        </p>
        <div className="layout-list">
          {layout.map((item, i) => {
            const info = layoutRowInfo(item);
            return (
              <div
                key={item.kind === 'section' ? `s-${item.key}` : `b-${item.id}`}
                className={`layout-row${info.visible ? '' : ' layout-row-hidden'}`}
              >
                <span className="layout-row-label">{info.label}</span>
                <span
                  className={`layout-badge${info.isBlock ? ' layout-badge-block' : ''}`}
                >
                  {info.badge}
                </span>
                <button
                  type="button"
                  className="layout-btn"
                  onClick={() => toggleLayoutItem(i)}
                  disabled={busyBlockId !== null}
                  title={info.visible ? 'Hide from the store' : 'Show on the store'}
                  aria-label={info.visible ? `Hide ${info.label}` : `Show ${info.label}`}
                >
                  {info.visible ? '👁' : '🚫'}
                </button>
                <button
                  type="button"
                  className="layout-btn"
                  onClick={() => moveLayout(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                  aria-label={`Move ${info.label} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="layout-btn"
                  onClick={() => moveLayout(i, 1)}
                  disabled={i === layout.length - 1}
                  title="Move down"
                  aria-label={`Move ${info.label} down`}
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn-red"
            onClick={saveLayout}
            disabled={saving !== null || busyBlockId !== null}
          >
            {saving === 'layout' ? 'Saving…' : 'Save Layout'}
          </button>
        </div>
      </div>

      {/* ---------- Custom blocks ---------- */}
      <div className="design-card">
        <h2>🧱 Custom Blocks</h2>
        <p className="design-card-hint">
          Your own content blocks for the home page — announcements, photos,
          banners and promo strips. A new block appears at the end of the
          home page; move it in the Home Page Layout list above.
        </p>
        <div className="admin-toolbar" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="btn-red"
            onClick={openAddBlock}
            disabled={blocks.length >= MAX_BLOCKS}
          >
            + Add Block
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>
            {blocks.length} of {MAX_BLOCKS} blocks
          </span>
        </div>
        {blocks.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            No custom blocks yet — add your first one above.
          </p>
        ) : (
          <div className="block-list">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`layout-row${block.visible ? '' : ' layout-row-hidden'}`}
              >
                <span className="layout-row-label">{blockLabel(block)}</span>
                <span className="layout-badge layout-badge-block">
                  {block.type}
                </span>
                <button
                  type="button"
                  className="btn-navy btn-small"
                  onClick={() => openEditBlock(block)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => deleteBlock(block)}
                  disabled={busyBlockId === block.id}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Footer ---------- */}
      <div className="design-card">
        <h2>🦶 Footer</h2>
        <p className="design-card-hint">
          The bottom of every page. The phone, email, address and WhatsApp
          lines come from Settings — only the about text and the columns are
          changed here.
        </p>
        <div className="form-field">
          <label>About text</label>
          <textarea
            className="input"
            value={footer.about}
            maxLength={500}
            rows={3}
            onChange={(e) => setFooter((f) => ({ ...f, about: e.target.value }))}
          />
        </div>
        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={footer.show_links}
              onChange={(e) =>
                setFooter((f) => ({ ...f, show_links: e.target.checked }))
              }
            />
            Quick Links column
          </label>
          <label>
            <input
              type="checkbox"
              checked={footer.show_categories}
              onChange={(e) =>
                setFooter((f) => ({ ...f, show_categories: e.target.checked }))
              }
            />
            Categories column
          </label>
          <label>
            <input
              type="checkbox"
              checked={footer.show_service}
              onChange={(e) =>
                setFooter((f) => ({ ...f, show_service: e.target.checked }))
              }
            />
            Customer Service column
          </label>
        </div>
        <button
          type="button"
          className="btn-red"
          onClick={saveFooter}
          disabled={saving !== null}
        >
          {saving === 'footer' ? 'Saving…' : 'Save Footer'}
        </button>
      </div>

      {/* ---------- Reset ---------- */}
      <div className="design-card">
        <h2>↩️ Reset to Default</h2>
        <p className="design-card-hint">
          Put the whole design back to the way it was built — colours, hero
          banner, header and footer, and the home page order. Your custom
          blocks are kept and moved to the end of the home page.
        </p>
        <button
          type="button"
          className="btn-outline"
          onClick={resetDesign}
          disabled={saving !== null}
        >
          {saving === 'reset' ? 'Resetting…' : 'Reset Design to Default'}
        </button>
      </div>

      {/* ---------- Block dialog ---------- */}
      {dialog && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{dialog.mode === 'edit' ? 'Edit Block' : 'New Block'}</h2>
            <form onSubmit={saveBlock}>
              {bFormError && <div className="form-error">{bFormError}</div>}

              <div className="form-field">
                <label>Block type *</label>
                <select
                  className="input"
                  value={bType}
                  onChange={(e) => setBType(e.target.value as DesignBlockType)}
                >
                  {BLOCK_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="variant-hint">
                  {BLOCK_TYPES.find((t) => t.type === bType)?.hint}
                </p>
              </div>

              <div className="form-field">
                <label>Name (shown only here, in the editor)</label>
                <input
                  className="input"
                  value={bTitle}
                  maxLength={60}
                  onChange={(e) => setBTitle(e.target.value)}
                  placeholder="e.g. Eid Sale banner"
                />
              </div>

              {bType === 'text' && (
                <>
                  <div className="form-field">
                    <label>Heading</label>
                    <input
                      className="input"
                      value={bHeading}
                      maxLength={120}
                      onChange={(e) => setBHeading(e.target.value)}
                      placeholder="e.g. Delivery Information"
                    />
                  </div>
                  <div className="form-field">
                    <label>Text</label>
                    <textarea
                      className="input"
                      value={bBody}
                      maxLength={2000}
                      rows={5}
                      onChange={(e) => setBBody(e.target.value)}
                      placeholder="Write the text for this block…"
                    />
                  </div>
                </>
              )}

              {bType === 'image' && (
                <>
                  {blockImageField()}
                  <div className="form-field">
                    <label>Caption (optional)</label>
                    <input
                      className="input"
                      value={bCaption}
                      maxLength={200}
                      onChange={(e) => setBCaption(e.target.value)}
                      placeholder="Shown under the photo"
                    />
                  </div>
                  <div className="form-field">
                    <label>Link (optional — where the photo leads)</label>
                    <input
                      className="input"
                      value={bLink}
                      maxLength={500}
                      onChange={(e) => setBLink(e.target.value)}
                      placeholder="e.g. /category/kitchen-and-dining"
                    />
                  </div>
                </>
              )}

              {bType === 'banner' && (
                <>
                  {blockImageField()}
                  <div className="form-field">
                    <label>Headline *</label>
                    <input
                      className="input"
                      value={bHeading}
                      maxLength={120}
                      onChange={(e) => setBHeading(e.target.value)}
                      placeholder="e.g. Winter Sale — Up to 50% Off"
                    />
                  </div>
                  <div className="form-field">
                    <label>Subtext</label>
                    <input
                      className="input"
                      value={bSubtext}
                      maxLength={200}
                      onChange={(e) => setBSubtext(e.target.value)}
                      placeholder="e.g. Warm deals on home essentials."
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Button text</label>
                      <input
                        className="input"
                        value={bButtonText}
                        maxLength={40}
                        onChange={(e) => setBButtonText(e.target.value)}
                        placeholder="e.g. Shop the Sale"
                      />
                    </div>
                    <div className="form-field">
                      <label>Button link</label>
                      <input
                        className="input"
                        value={bButtonLink}
                        maxLength={500}
                        onChange={(e) => setBButtonLink(e.target.value)}
                        placeholder="e.g. /#clearance"
                      />
                    </div>
                  </div>
                </>
              )}

              {bType === 'promo' && (
                <>
                  <div className="form-field">
                    <label>Message *</label>
                    <input
                      className="input"
                      value={bText}
                      maxLength={200}
                      onChange={(e) => setBText(e.target.value)}
                      placeholder="e.g. Eid Sale is live — up to 50% off everything!"
                    />
                  </div>
                  <div className="color-row">
                    <label>
                      Strip colour
                      <small>The background of the promo strip</small>
                    </label>
                    <input
                      type="color"
                      value={isHexColor(bBgColor) ? bBgColor : '#c8102e'}
                      onChange={(e) => setBBgColor(e.target.value)}
                      aria-label="Promo strip colour"
                    />
                    <input
                      className="input"
                      type="text"
                      value={bBgColor}
                      maxLength={7}
                      onChange={(e) => setBBgColor(e.target.value)}
                      aria-label="Promo strip colour hex code"
                    />
                  </div>
                </>
              )}

              <div className="checkbox-row" style={{ marginTop: 14 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={bVisible}
                    onChange={(e) => setBVisible(e.target.checked)}
                  />
                  Show this block on the store
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeDialog}
                  disabled={bSaving || bCompressing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-red"
                  disabled={bSaving || bCompressing}
                >
                  {bSaving
                    ? 'Saving…'
                    : dialog.mode === 'edit'
                      ? 'Save Changes'
                      : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
