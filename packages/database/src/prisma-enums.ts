/**
 * Valeurs runtime des enums Prisma — fichier dédié pour que Turbopack résolve
 * les exports nommés (le re-export groupé depuis index.ts + client CJS échoue parfois).
 */
import {
  LandingTeamVolet as LandingTeamVoletEnum,
  RhTeamType as RhTeamTypeEnum,
} from '../generated/client';

export const LandingTeamVolet = LandingTeamVoletEnum;
export const RhTeamType = RhTeamTypeEnum;

export type { LandingTeamVolet as LandingTeamVoletType, RhTeamType as RhTeamTypeType } from '../generated/client';
