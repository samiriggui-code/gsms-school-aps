import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@repo/redis';
import { formationDetailCacheKey } from '@/lib/catalog-public-cache';
import { buildPublicCatalogFormationDetail } from '@/lib/catalog-formation-detail';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ message: 'Paramètre slug requis.' }, { status: 400 });
  }

  try {
    const cacheKey = formationDetailCacheKey(slug);
    const cachedData = await getCache<Record<string, unknown>>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const detail = await buildPublicCatalogFormationDetail(prisma, slug);

    if (!detail) {
      const inactive = await prisma.formation.findFirst({
        where: { slug, status: 'ACTIVE' },
        select: { id: true, name: true, slug: true, catalogOffer: { select: { catalogStatus: true } } },
      });
      if (inactive) {
        return NextResponse.json({
          formation: { id: inactive.id, name: inactive.name, slug: inactive.slug },
          stats: null,
          sheet: null,
          catalogInactive: true,
        });
      }
      return NextResponse.json({ formation: null, stats: null, sheet: null, catalogInactive: false });
    }

    const result = {
      formation: detail.formation,
      catalogInactive: false,
      requiresQuote: detail.requiresQuote,
      stats: detail.stats,
      sheet: detail.sheet,
    };

    await setCache(cacheKey, result, 3600);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[catalog/formation]', e);
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
