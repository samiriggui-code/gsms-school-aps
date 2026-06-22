import type { PrismaClient } from '@repo/database';
import { delCache } from '@repo/redis';

export const CATALOG_FORMATIONS_LIST_KEY = 'catalog:formations:active';
export const CATALOG_TEAM_LIST_KEY = 'catalog:team:active';

export function formationDetailCacheKey(slug: string): string {
  return `formation:${slug.trim()}`;
}

export function catalogSessionsCacheKey(slug: string): string {
  return `sessions:${slug.trim()}`;
}

export async function invalidateCatalogFormationsListCache(): Promise<void> {
  await delCache(CATALOG_FORMATIONS_LIST_KEY);
}

export async function invalidateCatalogTeamListCache(): Promise<void> {
  await delCache(CATALOG_TEAM_LIST_KEY);
}

export async function invalidateCatalogSessionsCache(slug?: string): Promise<void> {
  const key = slug?.trim();
  if (!key) return;
  await delCache(catalogSessionsCacheKey(key));
}

export async function invalidateCatalogSessionsCacheForFormationId(
  prisma: PrismaClient,
  formationId: string,
): Promise<void> {
  const row = await prisma.formation.findUnique({
    where: { id: formationId },
    select: { slug: true },
  });
  if (row?.slug) {
    await invalidateCatalogSessionsCache(row.slug);
  }
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
    await invalidateCatalogSessionsCache(slug);
  }
}

/** Reprise après publication landing : purge liste + toutes les fiches actives. */
export async function invalidateAllActiveFormationCaches(
  prisma: PrismaClient,
): Promise<void> {
  await invalidateCatalogFormationsListCache();
  await invalidateCatalogTeamListCache();
  const offers = await prisma.formationCatalogOffer.findMany({
    where: {
      catalogStatus: 'ACTIVE',
      formation: { status: 'ACTIVE' },
    },
    select: { formation: { select: { slug: true } } },
  });
  await Promise.all(
    offers.flatMap((row) => [
      invalidateFormationDetailCache(row.formation.slug),
      invalidateCatalogSessionsCache(row.formation.slug),
    ]),
  );
}
