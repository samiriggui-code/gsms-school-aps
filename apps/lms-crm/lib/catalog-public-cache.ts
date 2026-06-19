import type { PrismaClient } from '@repo/database';
import { delCache } from '@repo/redis';

export const CATALOG_FORMATIONS_LIST_KEY = 'catalog:formations:active';

export function formationDetailCacheKey(slug: string): string {
  return `formation:${slug.trim()}`;
}

export async function invalidateCatalogFormationsListCache(): Promise<void> {
  await delCache(CATALOG_FORMATIONS_LIST_KEY);
}

export async function invalidateFormationDetailCache(slug: string): Promise<void> {
  const key = slug?.trim();
  if (!key) return;
  await delCache(formationDetailCacheKey(key));
}

/** Invalide la liste publique + éventuellement la fiche détail d'une formation. */
export async function invalidateFormationCatalogCaches(slug?: string): Promise<void> {
  await invalidateCatalogFormationsListCache();
  if (slug?.trim()) {
    await invalidateFormationDetailCache(slug);
  }
}

/** Reprise après publication landing : purge liste + toutes les fiches actives. */
export async function invalidateAllActiveFormationCaches(
  prisma: PrismaClient,
): Promise<void> {
  await invalidateCatalogFormationsListCache();
  const offers = await prisma.formationCatalogOffer.findMany({
    where: {
      catalogStatus: 'ACTIVE',
      formation: { status: 'ACTIVE' },
    },
    select: { formation: { select: { slug: true } } },
  });
  await Promise.all(
    offers.map((row) => invalidateFormationDetailCache(row.formation.slug)),
  );
}
