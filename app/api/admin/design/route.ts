import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import {
  DesignInputError,
  publicHeroSlides,
  validateFooter,
  validateHeader,
  validateHero,
  validateHomeLayout,
  validateTheme,
  type DesignHero,
} from '@/lib/design';
import { revalidateStorefront } from '@/lib/revalidate';
import {
  ensureDesignSchema,
  getDesign,
  getDesignBlocks,
  getSettings,
  hasDb,
  resolveHeroImageValue,
  setSetting,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireAdminResponse(): Promise<NextResponse | null> {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  return null;
}

// The whole design in one response: theme, hero, header, footer, home
// layout, custom blocks and the announcement text (which the Design page
// edits together with the header — it is the same `announcement` setting
// Admin → Settings uses, not a copy).
export async function GET() {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  await ensureDesignSchema();
  const blocks = await getDesignBlocks();
  const design = await getDesign(blocks.map((b) => b.id));
  const settings = await getSettings();
  design.hero = publicHeroSlides(design.hero);
  return NextResponse.json({
    design,
    blocks,
    announcement: settings.announcement ?? '',
  });
}

// Save any part of the design: send only the fields that changed —
// { theme, hero, header, footer, layout, announcement }. Each field is
// validated before it is stored. A hero slide photo the owner did not
// touch comes back as an /api/image?hero=N URL — resolved to the stored
// value so it is kept, and so the request stays small (no base64
// re-upload for unchanged photos).
export async function PUT(req: Request) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  try {
    const body = await req.json();
    await ensureDesignSchema();
    const blocks = await getDesignBlocks();
    const blockIds = blocks.map((b) => b.id);
    const current = await getDesign(blockIds);

    let changed = false;

    if (body.theme !== undefined) {
      const theme = validateTheme(body.theme);
      await setSetting('design_theme', JSON.stringify(theme));
      changed = true;
    }

    if (body.hero !== undefined) {
      const hero = validateHero(body.hero);
      // Resolve keep-the-photo markers to the stored slide photos.
      const resolved: DesignHero = {
        visible: hero.visible,
        slides: hero.slides.map((slide) => ({
          ...slide,
          image: resolveHeroImageValue(slide.image, current.hero.slides),
        })),
      };
      await setSetting('design_hero', JSON.stringify(resolved));
      changed = true;
    }

    if (body.header !== undefined) {
      const header = validateHeader(body.header);
      await setSetting('design_header', JSON.stringify(header));
      changed = true;
    }

    if (body.announcement !== undefined) {
      const text = String(body.announcement ?? '').trim().slice(0, 200);
      await setSetting('announcement', text);
      changed = true;
    }

    if (body.footer !== undefined) {
      const footer = validateFooter(body.footer);
      await setSetting('design_footer', JSON.stringify(footer));
      changed = true;
    }

    if (body.layout !== undefined) {
      const layout = validateHomeLayout(body.layout, blockIds);
      await setSetting('design_home_layout', JSON.stringify(layout));
      changed = true;
    }

    if (!changed) {
      return NextResponse.json({ ok: true, changed: false });
    }
    // Design changes must show to customers at once — purge the cached
    // storefront pages.
    revalidateStorefront();
    return NextResponse.json({ ok: true, changed: true });
  } catch (err) {
    const status = err instanceof DesignInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not save the design.' },
      { status },
    );
  }
}
