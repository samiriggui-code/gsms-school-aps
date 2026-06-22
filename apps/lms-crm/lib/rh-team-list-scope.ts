import type { RhTeamTypeValue } from '@/lib/prisma-enum-types';

/** Périmètre liste équipes RH — permanentes école vs temporaires session formation. */
export type RhTeamListScope = 'permanent' | 'session';

/** Les 4 équipes permanentes seedées (Direction, Pédagogie, Formateurs, RH). */
export const PERMANENT_SCHOOL_TEAM_TYPES: RhTeamTypeValue[] = [
  'DIRECTION',
  'PEDAGOGICAL',
  'TRAINER_POOL',
  'HR_ADMIN',
];

/** Filtre cycle de vie des équipes session (voir `RhTeamLifecycleStatus`). */
export type RhSessionTeamPhase = 'running' | 'active' | 'post_exam' | 'archived' | 'all';

export const RH_TEAM_LIST_SCOPE_LABELS: Record<RhTeamListScope, string> = {
  permanent: 'Équipes permanentes (école)',
  session: 'Équipes session (formations)',
};

export const RH_TEAM_LIST_SCOPE_HINTS: Record<RhTeamListScope, string> = {
  permanent:
    'Pôles Direction, pédagogie, formateurs, RH — structure stable de l’établissement (siège).',
  session:
    'Une équipe par session catalogue : formateur, référent pédagogique et apprenants inscrits — chat, notifications et suivi jusqu’à l’examen.',
};

export const RH_SESSION_TEAM_PHASE_LABELS: Record<RhSessionTeamPhase, string> = {
  running: 'À venir / en cours / post-examen',
  active: 'Session en cours',
  post_exam: 'Post-examen',
  archived: 'Sessions clôturées',
  all: 'Toutes les sessions',
};
