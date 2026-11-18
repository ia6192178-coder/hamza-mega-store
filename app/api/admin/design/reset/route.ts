import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { defaultHomeLayout } from '@/lib/design';
import { revalidateStorefront } from '@/lib/revalidate';
import {
  deleteSetting,
  ensureDesignSchema,
  getDesignBlocks,
  hasDb,
  setSetting,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/design/reset — restore the built-in design: the theme,
// hero, header and footer overrides are deleted (the store falls back to
// its defaults) and the home layout goes back to the built-in sections in
// their default order. Custom blocks are NOT deleted — they are appended
// to the end of the layout (in their saved order) so nothing the owner
// made is lost; they can be moved or hidden from the layout list.
export async function POST() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  try {
    await ensureDesignSchema();
    const blocks = await getDesignBlocks();
    await deleteSetting('design_theme');
    await deleteSetting('design_hero');
    await deleteSetting('design_header');
    await deleteSetting('design_footer');
    const layout = [
      ...defaultHomeLayout(),
      ...blocks.map((b) => ({ kind: 'block' as const, id: b.id })),
    ];
    await setSetting('design_home_layout', JSON.stringify(layout));
    revalidateStorefront();
    return NextResponse.json({ ok: true, layout });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not reset the design.' },
      { status: 500 },
    );
  }
}
