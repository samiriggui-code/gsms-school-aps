import type { Prisma } from '@repo/database';

export const teamInclude = {
  site: { select: { id: true, name: true } },
  orgUnit: { select: { id: true, name: true } },
  leader: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          status: true,
        },
      },
    },
  },
  _count: { select: { members: true } },
} satisfies Prisma.RhTeamInclude;

type TeamRow = Prisma.RhTeamGetPayload<{ include: typeof teamInclude }>;

export function serializeTeam(team: TeamRow) {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    type: team.type,
    sector: team.sector,
    image: team.image,
    siteId: team.siteId,
    orgUnitId: team.orgUnitId,
    leaderId: team.leaderId,
    Site: team.site,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    members: team.members.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      tenantUserId: m.userId,
      TenantUser: m.user
        ? {
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            email: m.user.email,
            avatar: m.user.avatar,
            status: m.user.status,
          }
        : null,
    })),
    _count: { members: team._count.members },
  };
}

export function nullishId(value: unknown): string | null {
  const v = String(value ?? '').trim();
  if (!v || v === 'none' || v === 'null') return null;
  return v;
}
