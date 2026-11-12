import { NextResponse } from 'next/server';
import { isAdminLoggedIn } from '@/lib/admin';
import { getOrdersWithItems, hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminLoggedIn())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. Run /api/seed first.' },
      { status: 500 },
    );
  }
  const orders = await getOrdersWithItems();
  return NextResponse.json({ orders });
}
