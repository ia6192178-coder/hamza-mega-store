import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { DesignInputError, validateBlock } from '@/lib/design';
import { revalidateStorefront } from '@/lib/revalidate';
import {
  deleteDesignBlock,
  ensureDesignSchema,
  getDesign,
  getDesignBlockImageValue,
  getDesignBlocks,
  hasDb,
  resolveBlockImageValue,
  setSetting,
  updateDesignBlock,
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

type RouteContext = { params: { id: string } };

function parseId(params: RouteContext['params']): number | null {
  const id = Number(params.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PUT(req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = parseId(params);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid block id.' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const input = validateBlock(body);
    await ensureDesignSchema();
    // A photo the owner did not touch comes back as an /api/image URL —
    // resolve it to the stored value so it is kept. A fresh upload (data
    // URL) or pasted link is stored as-is; a removed photo arrives as an
    // empty string and is dropped.
    const content = { ...input.content };
    if (input.type === 'image' || input.type === 'banner') {
      const existingImage = await getDesignBlockImageValue(id);
      content.image = resolveBlockImageValue(
        input.content.image ?? '',
        id,
        existingImage,
      );
    }
    const updated = await updateDesignBlock(id, { ...input, content });
    revalidateStorefront();
    return NextResponse.json({ ok: true, block: updated });
  } catch (err) {
    if (err instanceof Error && err.message === 'Block not found.') {
      return NextResponse.json({ error: 'Block not found.' }, { status: 404 });
    }
    const status = err instanceof DesignInputError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update the block.' },
      { status },
    );
  }
}

// Delete a block — its entry in the home page layout is removed too, so
// the layout never points at a missing block.
export async function DELETE(_req: Request, { params }: RouteContext) {
  const denied = await requireAdminResponse();
  if (denied) return denied;
  const id = parseId(params);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid block id.' }, { status: 400 });
  }
  try {
    await deleteDesignBlock(id);
    const blocks = await getDesignBlocks();
    const design = await getDesign(blocks.map((b) => b.id));
    await setSetting('design_home_layout', JSON.stringify(design.layout));
    revalidateStorefront();
    return NextResponse.json({ ok: true, layout: design.layout });
  } catch (err) {
    if (err instanceof Error && err.message === 'Block not found.') {
      return NextResponse.json({ error: 'Block not found.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not delete the block.' },
      { status: 500 },
    );
  }
}
