import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@repo/redis';
import { CATALOG_TEAM_LIST_KEY } from '@/lib/catalog-public-cache';
import { serializeLandingTeamOffer } from '@/lib/catalog-team-serialize';
import type { PublicCatalogTeamMember } from '@/lib/catalog-public-types';
import { landingTeamUserSelect } from '@/app/api/sections/communication-contenu/cms/landing-team/_user-select';

export const dynamic = 'force-dynamic';

/** Catalogue public landing : membres équipe ACTIVE uniquement. */
export async function GET() {
  try {
    const cached = await getCache<{ items: PublicCatalogTeamMember[] }>(CATALOG_TEAM_LIST_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const offers = await prisma.landingTeamOffer.findMany({
      where: { catalogStatus: 'ACTIVE' },
      orderBy: [{ volet: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
      include: { user: { select: landingTeamUserSelect } },
    });

    const items = offers.map((row) => serializeLandingTeamOffer(row));
    const payload = { items };
    await setCache(CATALOG_TEAM_LIST_KEY, payload, 300);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[catalog/team] GET failed', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
