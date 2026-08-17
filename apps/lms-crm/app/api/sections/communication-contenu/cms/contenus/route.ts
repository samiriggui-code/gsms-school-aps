import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FormationLifecycleStatus, Prisma } from '@repo/database';
import { serializeCmsCatalogRow } from '@/lib/cms-catalog-serialize';

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
  status: true,
  updatedAt: true,
} as const;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const scope = sp.get('scope')?.trim() ?? 'all';

  const where: Prisma.FormationCatalogOfferWhereInput = {
    ...(q
      ? {
          formation: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
    ...(scope === 'landing'
      ? {
          catalogStatus: FormationLifecycleStatus.ACTIVE,
          formation: { status: FormationLifecycleStatus.ACTIVE },
        }
      : scope === 'archived'
        ? { catalogStatus: FormationLifecycleStatus.ARCHIVED }
        : scope === 'draft'
          ? { catalogStatus: FormationLifecycleStatus.DRAFT }
          : {}),
  };

  try {
    const [total, landingVisible, activeOffers, draftOffers, archivedOffers, offers] =
      await Promise.all([
        prisma.formationCatalogOffer.count(),
        prisma.formationCatalogOffer.count({
          where: {
            catalogStatus: FormationLifecycleStatus.ACTIVE,
            formation: { status: FormationLifecycleStatus.ACTIVE },
          },
        }),
        prisma.formationCatalogOffer.count({
          where: { catalogStatus: FormationLifecycleStatus.ACTIVE },
        }),
        prisma.formationCatalogOffer.count({
          where: { catalogStatus: FormationLifecycleStatus.DRAFT },
        }),
        prisma.formationCatalogOffer.count({
          where: { catalogStatus: FormationLifecycleStatus.ARCHIVED },
        }),
        prisma.formationCatalogOffer.findMany({
          where,
          orderBy: [{ formation: { track: 'asc' } }, { formation: { name: 'asc' } }],
          include: {
            formation: {
              select: {
                ...formationSelect,
                _count: { select: { sessions: true } },
              },
            },
          },
        }),
      ]);

    const items = offers.map((offer) => {
      const row = serializeCmsCatalogRow(
        offer,
        offer.formation.status,
        offer.formation._count.sessions,
      );
      return { ...row, updatedAt: offer.formation.updatedAt.toISOString() };
    });

    return ok({
      stats: {
        total,
        landingVisible,
        active: activeOffers,
        draft: draftOffers,
        archived: archivedOffers,
      },
      items,
    });
  } catch (e) {
    return fail('Impossible de charger le catalogue vitrine.', 500, e);
  }
}
