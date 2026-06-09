/**
 * Exports sans `createPrismaClient` / `pg` — sûr pour les composants Next.js `use client`.
 * Le barrel `index.ts` ré-exporte `create-prisma-client`, ce qui tire `pg` → module Node `dns` indisponible côté navigateur.
 */
export {
  CandidatureStatus,
  CandidatureSource,
  FormationSessionEnrollmentStatus,
  FinanceDevisStatus,
  LeadStatus,
} from '../generated/client';
export {
  LANDING_LEAD_SOURCES,
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
  LANDING_QUOTE_LEAD_SOURCE,
} from './quote-lead-source';
export {
  DEFAULT_LANDING_SECTIONS,
  LANDING_SECTION_CATALOG,
  landingSectionLabel,
  normalizeLandingSections,
  type LandingSectionConfig,
} from './landing-sections';
// Re-export landing CMS helpers (no Prisma / pg) for composants client Next.js
