import {
  DEFAULT_LANDING_SECTIONS,
  normalizeLandingSections,
  withDbTimeout,
} from '@repo/database';
import prisma from '@/lib/prisma';
import {
  DEFAULT_LANDING_PAGE_CONFIG,
  type LandingPageConfig,
} from '@/lib/landing-config-defaults';

export type { LandingPageConfig } from '@/lib/landing-config-defaults';
export { DEFAULT_LANDING_PAGE_CONFIG } from '@/lib/landing-config-defaults';

const DB_TIMEOUT_MS = 3_000;

export async function getLandingPageConfig(): Promise<LandingPageConfig> {
  return withDbTimeout(
    (async () => {
      try {
        const row = await prisma.landingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
        if (!row) return DEFAULT_LANDING_PAGE_CONFIG;

        const sections = normalizeLandingSections(row.sections);
        return {
          enabled: row.enabled,
          sections: sections.length ? sections : DEFAULT_LANDING_SECTIONS,
        };
      } catch (error) {
        console.error('[landing-config] PostgreSQL indisponible, configuration par défaut.', error);
        return DEFAULT_LANDING_PAGE_CONFIG;
      }
    })(),
    DB_TIMEOUT_MS,
    DEFAULT_LANDING_PAGE_CONFIG,
  );
}
