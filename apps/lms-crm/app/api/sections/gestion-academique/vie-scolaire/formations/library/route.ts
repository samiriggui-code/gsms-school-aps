import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { FormationLibraryApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import type { FormationVitrineTrack } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const [formations, offers] = await Promise.all([
      prisma.formation.findMany({
        orderBy: [{ track: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          slug: true,
          name: true,
          track: true,
          tag: true,
          duration: true,
          parcoursSpecialite: true,
          traineesMin: true,
          traineesMax: true,
        },
      }),
      prisma.formationCatalogOffer.findMany({ select: { formationId: true } }),
    ]);

    const taken = new Set(offers.map((o) => o.formationId));

    const items: FormationLibraryApiRow[] = formations
      .map((f) => {
        const effT = effectiveTraineesBandForFormationScalars({
          traineesMin: f.traineesMin,
          traineesMax: f.traineesMax,
          duration: f.duration,
          track: f.track,
        });
        return {
          id: f.id,
          slug: f.slug,
          name: f.name,
          track: f.track as FormationVitrineTrack,
          tag: f.tag,
          duration: f.duration,
          parcoursSpecialite: f.parcoursSpecialite as FormationLibraryApiRow['parcoursSpecialite'],
          traineesMin: effT.traineesMin,
          traineesMax: effT.traineesMax,
          alreadyInCatalog: taken.has(f.id),
        };
      })
      .sort((a, b) => {
        if (a.alreadyInCatalog !== b.alreadyInCatalog) return a.alreadyInCatalog ? 1 : -1;
        const trackCmp = String(a.track).localeCompare(String(b.track), 'fr');
        if (trackCmp !== 0) return trackCmp;
        return a.name.localeCompare(b.name, 'fr');
      });

    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger la bibliothèque des formations.', 500, error);
  }
}
