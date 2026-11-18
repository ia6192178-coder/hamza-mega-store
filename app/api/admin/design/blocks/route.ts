import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import {
  DesignInputError,
  MAX_BLOCKS,
  validateBlock,
} from '@/lib/design';
import { revalidateStorefront } from '@/lib/revalidate';
import {
  createDesignBlock,
  ensureDesignSchema,
  getDesign,
  getDesignBlocks,
  hasDb,
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

export async function GET() {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  await ensureDesignSchema();
  const blocks = await getDesignBlocks();
  return NextResponse.json({ blocks });
}

// Create a block. A new block is added to the end of the home page layout
// automatically (visible, so it shows on the store at once) — the owner
// can move it in the Home Page Layout list.
export async function POST(req: Request) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  try {
    const body = await req.json();
    const input = validateBlock(body);
    await ensureDesignSchema();
    const existing = await getDesignBlocks();
    if (existing.length >= MAX_BLOCKS) {
      return NextResponse.json(
        { error: `You can have at most ${MAX_BLOCKS} custom blocks. Delete one first.` },
        { status: 400 },
      );
    }
    const block = await createDesignBlock(input);
    // Append the new block to the home layout so it appears on the store.
    const design = await getDesign([...existing.map((b) => b.id), block.id]);
    const layout = [...design.layout, { kind: 'block' as const, id: block.id }];
    await setSetting('design_home_layout', JSON.stringify(layout));
    revalidateStorefront();
    return NextResponse.json({ ok: true, block, layout }, { status: 201 });
  } catch (err) {
    const status = err instanceof DesignInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create the block.' },
      { status },
    );
  }
}
