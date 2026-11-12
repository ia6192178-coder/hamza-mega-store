import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }
  try {
    const body = await req.json();
    const status = String(body.status ?? '');
    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${ALLOWED.join(', ')}.` },
        { status: 400 },
      );
    }
    const { rowCount } = await sql`
      UPDATE orders SET status = ${status} WHERE id = ${id}
    `;
    if ((rowCount ?? 0) === 0) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not update the order.' },
      { status: 500 },
    );
  }
}
