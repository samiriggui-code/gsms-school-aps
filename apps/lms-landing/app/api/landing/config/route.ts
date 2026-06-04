import { NextResponse } from 'next/server';
import { getLandingPageConfig } from '@/lib/landing-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await getLandingPageConfig();
  return NextResponse.json(config);
}
