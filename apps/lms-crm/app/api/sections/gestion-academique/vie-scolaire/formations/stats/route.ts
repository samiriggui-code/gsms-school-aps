import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { FormationCatalogStatsApi } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import type { FormationVitrineTrack } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';

const TRACK_KEYS: FormationVitrineTrack[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const [totalFormations, activeFormations, draftFormations, archivedFormations, activeOffers, totalVitrineSessions] =
      await Promise.all([
        prisma.formationCatalogOffer.count(),
        prisma.formationCatalogOffer.count({ where: { catalogStatus: 'ACTIVE' } }),
        prisma.formationCatalogOffer.count({ where: { catalogStatus: 'DRAFT' } }),
        prisma.formationCatalogOffer.count({ where: { catalogStatus: 'ARCHIVED' } }),
        prisma.formationCatalogOffer.findMany({
          where: { catalogStatus: 'ACTIVE' },
          select: { formation: { select: { featured: true, track: true } } },
        }),
        prisma.formationSession.count(),
      ]);

    const featuredFormations = activeOffers.filter((o) => o.formation.featured).length;

    const byTrack: FormationCatalogStatsApi['byTrack'] = {};
    for (const k of TRACK_KEYS) byTrack[k] = 0;
    for (const o of activeOffers) {
      const key = o.formation.track as FormationVitrineTrack;
      if (TRACK_KEYS.includes(key)) {
        byTrack[key] = (byTrack[key] ?? 0) + 1;
      }
    }

    const payload: FormationCatalogStatsApi = {
      totalFormations,
      activeFormations,
      draftFormations,
      archivedFormations,
      featuredFormations,
      totalVitrineSessions,
      byTrack,
    };

    return ok(payload);
  } catch (error) {
    return fail('Impossible de récupérer les statistiques catalogue formations.', 500, error);
  }
}
