import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@repo/redis';
import { mapCatalogOfferToApiRow } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_map-rows';
import {
  CATALOG_FORMATIONS_LIST_KEY,
  invalidateCatalogFormationsListCache,
} from '@/lib/catalog-public-cache';
import type { PublicCatalogFormationItem } from '@/lib/catalog-public-types';

export const dynamic = 'force-dynamic';

const formationSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  track: true,
  tag: true,
  duration: true,
  modules: true,
  outcomes: true,
  featured: true,
  parcoursSpecialite: true,
  catalogProgramConfig: true,
  priceFrom: true,
  traineesMin: true,
  traineesMax: true,
  currency: true,
  fundingBlocks: true,
  prerequisitesTable: true,
  logoUrl: true,
  providerName: true,
  providerEmail: true,
  providerPhone: true,
  providerAddress: true,
  nextSessionLabel: true,
  cpfEligible: true,
  qualiopiCertified: true,
  presentationTitle: true,
  longDescription: true,
  presentationBullets: true,
  programModules: true,
  certificationSteps: true,
  complementaryDetails: true,
  fundingChannels: true,
  unitsCount: true,
  volumeHoursLabel: true,
  theoryPercent: true,
  practicePercent: true,
  minAgeLabel: true,
  frenchLevel: true,
  authorizationSummary: true,
  criminalRecordRequirement: true,
  rncpUrl: true,
} as const;

/** Catalogue public landing : uniquement les offres ACTIVE du CRM école. */
export async function GET() {
  try {
    const cached = await getCache<{ items: PublicCatalogFormationItem[] }>(
      CATALOG_FORMATIONS_LIST_KEY,
    );
    if (cached) {
      return NextResponse.json(cached);
    }

    const offers = await prisma.formationCatalogOffer.findMany({
      where: {
        catalogStatus: 'ACTIVE',
        formation: { status: 'ACTIVE' },
      },
      orderBy: [{ formation: { track: 'asc' } }, { formation: { name: 'asc' } }],
      include: {
        formation: { select: formationSelect },
      },
    });

    const items: PublicCatalogFormationItem[] = [];
    for (const row of offers) {
      try {
        const mapped = mapCatalogOfferToApiRow(row);
        items.push({
          slug: mapped.slug,
          name: mapped.name,
          track: mapped.track,
          tag: mapped.tag,
          duration: mapped.duration,
          description: mapped.description,
          modules: mapped.modules,
          outcomes: mapped.outcomes,
          featured: mapped.featured,
          priceFrom: mapped.priceFrom,
          currency: mapped.currency,
        });
      } catch (e) {
        console.warn('[catalog/formations] offre ignorée', row.formation?.slug, e);
      }
    }

    const payload = { items };
    await setCache(CATALOG_FORMATIONS_LIST_KEY, payload, 3600);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[catalog/formations]', e);
    await invalidateCatalogFormationsListCache();
    return NextResponse.json({ message: 'Erreur serveur.' }, { status: 500 });
  }
}
