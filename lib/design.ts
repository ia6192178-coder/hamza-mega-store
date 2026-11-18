// Design Editor (v6.3) — everything the Admin Panel's Design page can
// change, stored in the `settings` table as JSON (theme, hero, header,
// footer, home layout) plus the `design_blocks` table (custom blocks).
//
// Every parse function here FAILS SAFE: bad, missing or partial data falls
// back to the built-in defaults field by field, so the storefront can
// never break because of a design setting.
//
// Settings keys:
//   design_theme       — { primary, accent, header_bg, button_bg }
//   design_hero        — { visible, slides: [{ image, title, subtitle, button_text, button_link }] }
//   design_header      — { announcement_visible }
//   design_footer      — { about, show_links, show_categories, show_service }
//   design_home_layout — [{ kind: 'section', key, visible } | { kind: 'block', id }]
// The announcement text itself lives in the plain `announcement` setting
// (shared with Admin → Settings) — the Design page edits the same key,
// it is not duplicated.

import { validateCategoryImageUrl } from './categories';
import type { DesignBlock, DesignBlockContent, DesignBlockType, Settings } from './types';

// NOTE: this module is imported by the Admin Design page (a client
// component), so it must stay free of server-only imports — in
// particular it must NOT import lib/seed-data (the 31 sample products
// would ship to the browser). The built-in hero slides live here instead.

// ---------- Types ----------

export type DesignTheme = {
  primary: string;
  accent: string;
  header_bg: string;
  button_bg: string;
};

export type HeroSlide = {
  image: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
};

export type DesignHero = {
  visible: boolean;
  slides: HeroSlide[];
};

export type DesignHeader = {
  announcement_visible: boolean;
};

export type DesignFooter = {
  about: string;
  show_links: boolean;
  show_categories: boolean;
  show_service: boolean;
};

export type HomeLayoutItem =
  | { kind: 'section'; key: string; visible: boolean }
  | { kind: 'block'; id: number };

export type Design = {
  theme: DesignTheme;
  hero: DesignHero;
  header: DesignHeader;
  footer: DesignFooter;
  layout: HomeLayoutItem[];
};

// ---------- Defaults (the site as it looks today) ----------

export const DEFAULT_THEME: DesignTheme = {
  primary: '#0a1633',
  accent: '#c8102e',
  header_bg: '#0a1633',
  button_bg: '#c8102e',
};

export const DEFAULT_FOOTER_ABOUT =
  'Your one-stop online shop for kitchen, home, fashion, toys and more — quality products at honest prices, delivered to your doorstep.';

export const DEFAULT_FOOTER: DesignFooter = {
  about: DEFAULT_FOOTER_ABOUT,
  show_links: true,
  show_categories: true,
  show_service: true,
};

export const DEFAULT_HEADER: DesignHeader = {
  announcement_visible: true,
};

// The built-in hero slides (the slideshow as it looks today). These are
// the fallback whenever no hero design is saved.
export const HERO_SLIDES: HeroSlide[] = [
  {
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
    title: 'Mega Sale — Up to 45% Off',
    subtitle: 'Kitchen, home, fashion & more. Quality products at honest prices.',
    button_text: 'Shop Best Sellers',
    button_link: '/#best-sellers',
  },
  {
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    title: 'Everything For Your Home',
    subtitle: '10 categories, 100s of products — delivered to your doorstep.',
    button_text: 'Browse Categories',
    button_link: '/#categories',
  },
  {
    image:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1600&q=80',
    title: 'Cash on Delivery Across Pakistan',
    subtitle: 'Order now, pay when your parcel arrives. Free delivery over Rs 7,000.',
    button_text: 'Shop New Arrivals',
    button_link: '/#new-arrivals',
  },
];

export function defaultHeroSlides(): HeroSlide[] {
  return HERO_SLIDES.map((s) => ({ ...s }));
}

export const DEFAULT_HERO: DesignHero = {
  visible: true,
  slides: defaultHeroSlides(),
};

// Built-in home page sections, in the order they appear today. `key` is
// the stable id used in the layout JSON; `label` is shown in the editor.
// `product` marks the sections that only render when products exist.
export const BUILTIN_SECTIONS: { key: string; label: string; product: boolean }[] = [
  { key: 'hero', label: 'Hero Banner (slideshow)', product: false },
  { key: 'promo', label: 'Promo Tiles (Delivery / COD / Exchange)', product: false },
  { key: 'categories', label: 'Shop by Category', product: false },
  { key: 'new-arrivals', label: 'New Arrivals', product: true },
  { key: 'budget', label: 'Budget — Below Rs 499', product: true },
  { key: 'clearance', label: 'Clearance Sale', product: true },
  { key: 'best-sellers', label: 'Best Sellers', product: true },
  { key: 'all-products', label: 'All Products', product: true },
  { key: 'why', label: 'Why Shop With Us card', product: false },
];

export function defaultHomeLayout(): HomeLayoutItem[] {
  return BUILTIN_SECTIONS.map((s) => ({
    kind: 'section' as const,
    key: s.key,
    visible: true,
  }));
}

export const MAX_HERO_SLIDES = 4;
export const MAX_BLOCKS = 20;

// ---------- Small helpers ----------

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function asString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// Parse a settings value as JSON, returning null when it is missing or
// invalid — callers fall back to defaults.
function parseJsonObject(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Invalid JSON — fall back to defaults.
  }
  return null;
}

// Shift a #rrggbb colour by a per-channel delta, for the derived shades
// the theme needs (nav bar, button hover). The deltas are the exact
// differences between the built-in shades, so the default theme
// reproduces the original colours exactly (--navy-2 #12224d, --navy-3
// #1b3263, --red-dark #a30d26) while a custom primary/accent shifts the
// same way. Returns the input unchanged when it is not valid hex.
export function shiftColor(
  hex: string,
  dr: number,
  dg: number,
  db: number,
): string {
  if (!isHexColor(hex)) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + dr));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + dg));
  const b = Math.min(255, Math.max(0, (num & 0xff) + db));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Built-in shade deltas (see shiftColor).
export const NAVY_2_SHIFT: [number, number, number] = [8, 12, 26];
export const NAVY_3_SHIFT: [number, number, number] = [17, 28, 48];
export const RED_DARK_SHIFT: [number, number, number] = [-37, -3, -8];

// ---------- Parsers (fail-safe, merge over defaults) ----------

export function parseTheme(raw: string | undefined): DesignTheme {
  const obj = parseJsonObject(raw);
  const theme: DesignTheme = { ...DEFAULT_THEME };
  if (!obj) return theme;
  if (isHexColor(obj.primary)) theme.primary = obj.primary;
  if (isHexColor(obj.accent)) theme.accent = obj.accent;
  if (isHexColor(obj.header_bg)) theme.header_bg = obj.header_bg;
  if (isHexColor(obj.button_bg)) theme.button_bg = obj.button_bg;
  return theme;
}

function parseHeroSlide(raw: unknown): HeroSlide | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  return {
    image: asString(s.image, 2000000),
    title: asString(s.title, 100),
    subtitle: asString(s.subtitle, 200),
    button_text: asString(s.button_text, 40),
    button_link: asString(s.button_link, 500),
  };
}

export function parseHero(raw: string | undefined): DesignHero {
  const obj = parseJsonObject(raw);
  if (!obj) return { visible: true, slides: defaultHeroSlides() };
  const visible = asBool(obj.visible, true);
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
  const slides = slidesRaw
    .slice(0, MAX_HERO_SLIDES)
    .map(parseHeroSlide)
    .filter((s): s is HeroSlide => s !== null);
  // An empty or invalid slides list falls back to the built-in slides —
  // the hero must never render blank.
  return { visible, slides: slides.length > 0 ? slides : defaultHeroSlides() };
}

export function parseHeader(raw: string | undefined): DesignHeader {
  const obj = parseJsonObject(raw);
  if (!obj) return { ...DEFAULT_HEADER };
  return { announcement_visible: asBool(obj.announcement_visible, true) };
}

export function parseFooter(raw: string | undefined): DesignFooter {
  const obj = parseJsonObject(raw);
  if (!obj) return { ...DEFAULT_FOOTER };
  const about = asString(obj.about, 500);
  return {
    about: about || DEFAULT_FOOTER_ABOUT,
    show_links: asBool(obj.show_links, true),
    show_categories: asBool(obj.show_categories, true),
    show_service: asBool(obj.show_service, true),
  };
}

// Parse + sanitise the home layout. Unknown section keys, duplicate
// sections and block items pointing at missing blocks are dropped;
// built-in sections missing from the list are appended (visible) in
// their default order, so a section can never vanish by accident.
export function parseHomeLayout(
  raw: string | undefined,
  blockIds: number[],
): HomeLayoutItem[] {
  const knownSections = new Set(BUILTIN_SECTIONS.map((s) => s.key));
  const knownBlocks = new Set(blockIds);
  const items: HomeLayoutItem[] = [];
  const seenSections = new Set<string>();
  const seenBlocks = new Set<number>();

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (!entry || typeof entry !== 'object') continue;
          const e = entry as Record<string, unknown>;
          if (e.kind === 'section' && typeof e.key === 'string') {
            if (!knownSections.has(e.key) || seenSections.has(e.key)) continue;
            seenSections.add(e.key);
            items.push({
              kind: 'section',
              key: e.key,
              visible: asBool(e.visible, true),
            });
          } else if (e.kind === 'block' && typeof e.id === 'number') {
            if (!knownBlocks.has(e.id) || seenBlocks.has(e.id)) continue;
            seenBlocks.add(e.id);
            items.push({ kind: 'block', id: e.id });
          }
        }
      }
    } catch {
      // Invalid JSON — fall through to the default layout.
      items.length = 0;
      seenSections.clear();
    }
  }

  // Append any built-in section the list is missing, in default order.
  for (const s of BUILTIN_SECTIONS) {
    if (!seenSections.has(s.key)) {
      items.push({ kind: 'section', key: s.key, visible: true });
    }
  }
  return items;
}

// The whole design in one object, read from a Settings map (one DB query
// via getSettings). Block ids are needed to sanitise the layout.
export function parseDesign(settings: Settings, blockIds: number[]): Design {
  return {
    theme: parseTheme(settings.design_theme),
    hero: parseHero(settings.design_hero),
    header: parseHeader(settings.design_header),
    footer: parseFooter(settings.design_footer),
    layout: parseHomeLayout(settings.design_home_layout, blockIds),
  };
}

// Public URLs for hero slide photos: uploaded photos are stored as
// base64 data URLs — those are served through the /api/image route so
// page data and admin payloads stay light (a save only re-uploads a
// photo the owner actually changed; untouched photos come back as route
// URLs and are resolved to the stored value — see resolveHeroImageValue
// in lib/db.ts). Remote URLs pass through unchanged.
export function publicHeroSlides(hero: DesignHero): DesignHero {
  return {
    ...hero,
    slides: hero.slides.map((slide, i) => ({
      ...slide,
      image: slide.image.startsWith('data:')
        ? `/api/image?hero=${i}`
        : slide.image,
    })),
  };
}

// ---------- Validation for admin saves ----------

// User-facing design errors. API routes map these to 4xx; anything else
// is a 500.
export class DesignInputError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'DesignInputError';
    this.status = status;
  }
}

function requireHex(value: unknown, label: string): string {
  if (!isHexColor(value)) {
    throw new DesignInputError(`${label} must be a colour like #0a1633.`);
  }
  return value;
}

// Validate an incoming theme object (all four colours required).
export function validateTheme(input: unknown): DesignTheme {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError('Theme is missing.');
  }
  const t = input as Record<string, unknown>;
  return {
    primary: requireHex(t.primary, 'Primary colour'),
    accent: requireHex(t.accent, 'Accent colour'),
    header_bg: requireHex(t.header_bg, 'Header colour'),
    button_bg: requireHex(t.button_bg, 'Button colour'),
  };
}

// Validate one hero slide from the admin form. The image is either a
// fresh upload (data URL), a pasted https link, or an /api/image?hero=N
// URL meaning "keep the stored photo" — the last case is resolved by the
// caller (see resolveHeroImageValue in lib/db.ts).
export function validateHeroSlide(
  input: unknown,
  index: number,
): HeroSlide {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError(`Hero slide ${index + 1} is missing.`);
  }
  const s = input as Record<string, unknown>;
  const title = asString(s.title, 100);
  if (!title) {
    throw new DesignInputError(`Hero slide ${index + 1} needs a title.`);
  }
  const rawImage = String(s.image ?? '').trim();
  let image = '';
  if (rawImage.startsWith('/api/image?hero=')) {
    // Keep-the-photo marker — resolved by the caller.
    image = rawImage;
  } else {
    const { imageUrl, error } = validateCategoryImageUrl(rawImage);
    if (error) {
      throw new DesignInputError(`Hero slide ${index + 1}: ${error}`);
    }
    image = imageUrl ?? '';
  }
  const buttonLink = asString(s.button_link, 500);
  if (
    buttonLink &&
    !buttonLink.startsWith('/') &&
    !buttonLink.startsWith('http://') &&
    !buttonLink.startsWith('https://')
  ) {
    throw new DesignInputError(
      `Hero slide ${index + 1}: the button link must start with / or https://`,
    );
  }
  return {
    image,
    title,
    subtitle: asString(s.subtitle, 200),
    button_text: asString(s.button_text, 40),
    button_link: buttonLink,
  };
}

export function validateHero(input: unknown): DesignHero {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError('Hero banner is missing.');
  }
  const h = input as Record<string, unknown>;
  const slidesRaw = Array.isArray(h.slides) ? h.slides : [];
  if (slidesRaw.length === 0) {
    throw new DesignInputError('The hero banner needs at least one slide.');
  }
  if (slidesRaw.length > MAX_HERO_SLIDES) {
    throw new DesignInputError(
      `The hero banner can have at most ${MAX_HERO_SLIDES} slides.`,
    );
  }
  return {
    visible: asBool(h.visible, true),
    slides: slidesRaw.map((s, i) => validateHeroSlide(s, i)),
  };
}

export function validateHeader(input: unknown): DesignHeader {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError('Header settings are missing.');
  }
  const h = input as Record<string, unknown>;
  return { announcement_visible: asBool(h.announcement_visible, true) };
}

export function validateFooter(input: unknown): DesignFooter {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError('Footer settings are missing.');
  }
  const f = input as Record<string, unknown>;
  return {
    about: asString(f.about, 500) || DEFAULT_FOOTER_ABOUT,
    show_links: asBool(f.show_links, true),
    show_categories: asBool(f.show_categories, true),
    show_service: asBool(f.show_service, true),
  };
}

// Validate an incoming layout: keep the owner's order, drop duplicates
// and unknown sections, and re-append any missing built-in section so
// nothing vanishes. Block ids are checked against the live block list.
export function validateHomeLayout(
  input: unknown,
  blockIds: number[],
): HomeLayoutItem[] {
  if (!Array.isArray(input)) {
    throw new DesignInputError('Home page layout is missing.');
  }
  const knownSections = new Set(BUILTIN_SECTIONS.map((s) => s.key));
  const knownBlocks = new Set(blockIds);
  const items: HomeLayoutItem[] = [];
  const seenSections = new Set<string>();
  const seenBlocks = new Set<number>();
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (e.kind === 'section' && typeof e.key === 'string') {
      if (!knownSections.has(e.key) || seenSections.has(e.key)) continue;
      seenSections.add(e.key);
      items.push({
        kind: 'section',
        key: e.key,
        visible: asBool(e.visible, true),
      });
    } else if (e.kind === 'block' && typeof e.id === 'number') {
      if (!knownBlocks.has(e.id) || seenBlocks.has(e.id)) continue;
      seenBlocks.add(e.id);
      items.push({ kind: 'block', id: e.id });
    }
  }
  for (const s of BUILTIN_SECTIONS) {
    if (!seenSections.has(s.key)) {
      items.push({ kind: 'section', key: s.key, visible: true });
    }
  }
  return items;
}

// ---------- Custom blocks ----------

export const BLOCK_TYPES: { type: DesignBlockType; label: string; hint: string }[] = [
  {
    type: 'text',
    label: 'Text Block',
    hint: 'A heading + paragraphs — announcements, about text, delivery info.',
  },
  {
    type: 'image',
    label: 'Image Block',
    hint: 'One big photo, optionally linked — a poster, an offer banner.',
  },
  {
    type: 'banner',
    label: 'Banner Block',
    hint: 'A full-width photo banner with a headline and a button.',
  },
  {
    type: 'promo',
    label: 'Promo Strip',
    hint: 'A coloured strip with one short message across the page.',
  },
];

export function isBlockType(value: unknown): value is DesignBlockType {
  return (
    value === 'text' || value === 'image' || value === 'banner' || value === 'promo'
  );
}

// Validate one block's content for its type. Returns the cleaned content
// (only the fields that type uses). The image field may be an
// /api/image?block=N marker meaning "keep the stored photo" — resolved by
// the caller (see resolveBlockImageValue in lib/db.ts).
export function validateBlockContent(
  type: DesignBlockType,
  input: unknown,
): DesignBlockContent {
  const c = (input && typeof input === 'object'
    ? (input as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const imageField = (): string => {
    const raw = String(c.image ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('/api/image?block=')) return raw;
    const { imageUrl, error } = validateCategoryImageUrl(raw);
    if (error) throw new DesignInputError(error);
    return imageUrl ?? '';
  };

  const linkField = (key: string, label: string): string => {
    const link = asString(c[key], 500);
    if (
      link &&
      !link.startsWith('/') &&
      !link.startsWith('http://') &&
      !link.startsWith('https://')
    ) {
      throw new DesignInputError(`${label} must start with / or https://`);
    }
    return link;
  };

  switch (type) {
    case 'text': {
      const heading = asString(c.heading, 120);
      const body = asString(c.body, 2000);
      if (!heading && !body) {
        throw new DesignInputError('A text block needs a heading or some text.');
      }
      return { heading, body };
    }
    case 'image': {
      const image = imageField();
      if (!image) {
        throw new DesignInputError('An image block needs a photo.');
      }
      return {
        image,
        link: linkField('link', 'Image link'),
        caption: asString(c.caption, 200),
      };
    }
    case 'banner': {
      const image = imageField();
      if (!image) {
        throw new DesignInputError('A banner block needs a photo.');
      }
      const heading = asString(c.heading, 120);
      if (!heading) {
        throw new DesignInputError('A banner block needs a headline.');
      }
      return {
        image,
        heading,
        subtext: asString(c.subtext, 200),
        button_text: asString(c.button_text, 40),
        button_link: linkField('button_link', 'Button link'),
      };
    }
    case 'promo': {
      const text = asString(c.text, 200);
      if (!text) {
        throw new DesignInputError('A promo strip needs its message text.');
      }
      const bg = String(c.bg_color ?? '').trim();
      if (bg && !isHexColor(bg)) {
        throw new DesignInputError('Promo strip colour must be like #c8102e.');
      }
      return { text, bg_color: bg || '#c8102e' };
    }
  }
}

// Validate a whole block from the admin form (type + title + content).
export function validateBlock(input: unknown): {
  type: DesignBlockType;
  title: string;
  content: DesignBlockContent;
  visible: boolean;
} {
  if (!input || typeof input !== 'object') {
    throw new DesignInputError('Block is missing.');
  }
  const b = input as Record<string, unknown>;
  if (!isBlockType(b.type)) {
    throw new DesignInputError('Choose a block type first.');
  }
  return {
    type: b.type,
    title: asString(b.title, 60),
    content: validateBlockContent(b.type, b.content),
    visible: asBool(b.visible, true),
  };
}

// The label shown for a block in the editor (its title, or its type).
export function blockLabel(block: DesignBlock): string {
  if (block.title) return block.title;
  const found = BLOCK_TYPES.find((t) => t.type === block.type);
  return found ? found.label : 'Block';
}
