import type { CatalogProgramOpen } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { getFormationCatalogProgram } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';

type DbCatalogRow = {
  slug: string;
  catalogProgramConfig?: unknown;
};

/**
 * Résout l'ouverture du sheet programme : priorité config Prisma (`catalogProgramConfig`),
 * repli sur le catalogue vitrine statique (legacy landing).
 */
export function resolveCatalogProgramOpen(row: DbCatalogRow): CatalogProgramOpen | null {
  const raw = row.catalogProgramConfig;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const cfg = raw as Record<string, unknown>;
    if (typeof cfg.sheet === 'string' && cfg.sheet.length > 0) {
      return { sheet: cfg.sheet as CatalogProgramOpen['sheet'] } as CatalogProgramOpen;
    }
  }
  return getFormationCatalogProgram(row.slug) ?? null;
}
