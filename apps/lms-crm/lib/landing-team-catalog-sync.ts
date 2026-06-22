import type { PrismaClient } from '@repo/database';
import type { LandingTeamVoletValue, RhTeamTypeValue } from '@/lib/prisma-enum-types';
import { invalidateCatalogTeamListCache } from '@/lib/catalog-public-cache';

const SYNC_RH_TEAM_TYPES = [
  'DIRECTION',
  'TRAINER_POOL',
  'PEDAGOGICAL',
  'HR_ADMIN',
] as const satisfies readonly RhTeamTypeValue[];

const VOLET_BY_TEAM_TYPE = {
  DIRECTION: 'direction',
  TRAINER_POOL: 'formateur',
  PEDAGOGICAL: 'pedagogique',
  HR_ADMIN: 'rh',
} as const satisfies Partial<Record<RhTeamTypeValue, LandingTeamVoletValue>>;

/** Aligne le catalogue landing (#trainers) sur les équipes RH permanentes du CRM. */
export async function syncLandingTeamOffersFromRhTeams(
  db: PrismaClient,
): Promise<{ published: number }> {
  const teams = await db.rhTeam.findMany({
    where: {
      lifecycleStatus: 'ACTIVE',
      formationSessionId: null,
      type: { in: [...SYNC_RH_TEAM_TYPES] },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, isTrashed: true, status: true } },
        },
      },
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  let sortOrder = 0;
  for (const team of teams) {
    const volet = (
      VOLET_BY_TEAM_TYPE as Partial<Record<RhTeamTypeValue, LandingTeamVoletValue>>
    )[team.type];
    if (!volet) continue;
    for (const member of team.members) {
      const u = member.user;
      if (!u || u.isTrashed || u.status !== 'ACTIVE') continue;
      await db.landingTeamOffer.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          volet,
          catalogStatus: 'ACTIVE',
          sortOrder,
        },
        update: {
          volet,
          catalogStatus: 'ACTIVE',
          sortOrder,
        },
      });
      sortOrder += 1;
    }
  }

  await invalidateCatalogTeamListCache();
  return { published: sortOrder };
}
