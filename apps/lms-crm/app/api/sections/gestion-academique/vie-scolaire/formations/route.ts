import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CrmEventService } from '@repo/api-core';
import { mapCatalogOfferToApiRow } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_map-rows';
import { FormationCatalogOfferCreateSchema } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/forms/formation-catalog-api-schemas';

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
} satisfies Prisma.FormationSelect;

/** Vue liste CRM : défaut sans les offres ARCHIVED (= « retirées du catalogue » pour l’usage courant). */
function catalogOffersWhere(scope: string | null): Prisma.FormationCatalogOfferWhereInput {
  const s = scope?.trim() ?? 'visible';
  if (s === 'archived') return { catalogStatus: 'ARCHIVED' };
  if (s === 'all') return {};
  return { catalogStatus: { in: ['ACTIVE', 'DRAFT'] } };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const scope = request.nextUrl.searchParams.get('scope');
    const offers = await prisma.formationCatalogOffer.findMany({
      where: catalogOffersWhere(scope),
      orderBy: [{ formation: { track: 'asc' } }, { formation: { name: 'asc' } }],
      include: {
        formation: { select: formationSelect },
      },
    });

    const items = [];
    for (const row of offers) {
      try {
        items.push(mapCatalogOfferToApiRow(row));
      } catch (e) {
        console.warn('[formations/catalog] offre ignorée', row.formation?.slug, e);
      }
    }

    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger le catalogue formations.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = FormationCatalogOfferCreateSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation ajout catalogue.', 422, parsed.error.flatten());
  }

  const body = parsed.data;

  try {
    const formation = await prisma.formation.findUnique({
      where: { id: body.formationId },
      select: { id: true, parcoursSpecialite: true },
    });
    if (!formation) return fail('Formation référence introuvable.', 404);

    const dup = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: body.formationId },
    });
    if (dup) return fail('Cette formation est déjà dans votre catalogue.', 409);

    await prisma.formationCatalogOffer.create({
      data: {
        formationId: body.formationId,
        catalogStatus: body.catalogStatus ?? 'ACTIVE',
        priceFromOverride:
          body.priceFrom === undefined || body.priceFrom === null ? undefined : body.priceFrom,
        currencyOverride:
          body.currency === undefined || body.currency === null || body.currency === ''
            ? undefined
            : body.currency,
        parcoursSpecialiteOverride:
          body.parcoursSpecialite !== undefined &&
          body.parcoursSpecialite !== formation.parcoursSpecialite
            ? body.parcoursSpecialite
            : undefined,
        fundingBlocksOverride:
          body.fundingBlocks === undefined || body.fundingBlocks === null
            ? undefined
            : (body.fundingBlocks as Prisma.InputJsonValue),
        fundingChannelsOverride:
          body.fundingChannels === undefined || body.fundingChannels === null
            ? undefined
            : (body.fundingChannels as Prisma.InputJsonValue),
        prerequisitesTableOverride:
          body.prerequisitesTable === undefined || body.prerequisitesTable === null
            ? undefined
            : (body.prerequisitesTable as Prisma.InputJsonValue),
      },
    });

    const offer = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: body.formationId },
      include: { formation: { select: formationSelect } },
    });

    if (!offer?.formation) return fail('Offre créée mais relecture impossible.', 500);

    const actorId = session.user?.id ?? null;
    const formationName = offer.formation.name;
    const slug = offer.formation.slug;
    const eventService = new CrmEventService(prisma);
    await eventService.enqueue({
      eventType: 'catalog.offer.created',
      title: 'Nouveau catalogue formation',
      body: `« ${formationName} » a été ajouté au catalogue formations.`,
      href: `/gestion-academique/vie-scolaire/formations`,
      specialty: offer.formation.parcoursSpecialite ?? null,
      payload: { formationId: offer.formation.id, slug },
      createdById: actorId,
      dedupeKey: `catalog-offer:${offer.formation.id}`,
    });
    void eventService.processPending(5).catch((e) => {
      console.error('[formations/catalog] dispatch événement', e);
    });

    return ok({ item: mapCatalogOfferToApiRow(offer) }, 201);
  } catch (error) {
    return fail('Impossible d’ajouter la formation au catalogue.', 500, error);
  }
}
