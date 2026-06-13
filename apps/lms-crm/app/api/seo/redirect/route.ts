import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSeoRedirectFromCache, setSeoRedirectCache } from '@/lib/seo-redirect-cache';

export const dynamic = 'force-dynamic';

/** Résolution redirection SEO (proxy landing). */
export async function GET(request: NextRequest) {
  const path = (request.nextUrl.searchParams.get('path') ?? '').trim();
  if (!path.startsWith('/')) {
    return NextResponse.json({ target: null });
  }

  try {
    const cached = await getSeoRedirectFromCache(path);
    if (cached) {
      return NextResponse.json({ target: cached.target, type: cached.type });
    }

    const row = await prisma.seoRedirect.findFirst({
      where: { sourcePath: path, active: true },
    });
    if (!row) return NextResponse.json({ target: null });

    const entry = { target: row.targetPath, type: row.redirectType };
    await setSeoRedirectCache(path, entry);
    return NextResponse.json(entry);
  } catch (e) {
    console.error('[seo/redirect]', e);
    return NextResponse.json({ target: null });
  }
}
