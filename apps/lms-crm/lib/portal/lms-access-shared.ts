/** Sans dépendance Prisma/pg — importable depuis les composants `use client`. */

export type LmsAccessTier = 'none' | 'pre_cnaps' | 'full';

export function lmsAccessLabel(tier: LmsAccessTier): string {
  switch (tier) {
    case 'full':
      return 'Accès complet';
    case 'pre_cnaps':
      return 'Modules préparatoires (CNAPS en cours)';
    default:
      return 'Accès limité — complétez votre dossier';
  }
}
