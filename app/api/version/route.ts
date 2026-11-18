import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

// Public version marker — GET /api/version returns the deployed build
// version, so the owner/developer can confirm a new version actually went
// live (e.g. after re-uploading a ZIP to GitHub).

export async function GET() {
  return NextResponse.json({ name: 'hamza-mega-store', version: APP_VERSION });
}
