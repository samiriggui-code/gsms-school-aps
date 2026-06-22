import { LandingTeamVolet, RhTeamType } from '@repo/database';

/** Type union des valeurs enum Prisma (le symbole exporté est la valeur runtime). */
export type RhTeamTypeValue = (typeof RhTeamType)[keyof typeof RhTeamType];
export type LandingTeamVoletValue = (typeof LandingTeamVolet)[keyof typeof LandingTeamVolet];
