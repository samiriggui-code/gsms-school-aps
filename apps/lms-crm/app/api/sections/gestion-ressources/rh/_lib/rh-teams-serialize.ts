import type { Prisma } from '@repo/database';

export const teamInclude = {
  site: { select: { id: true, name: true } },
  orgUnit: { select: { id: true, name: true } },
  leader: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  formationSession: {
    select: {
      id: true,
      dateDisplayLabel: true,
      trainerUserId: true,
      moderatorUserId: true,
      formation: { select: { id: true, name: true } },
      trainer: {
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
      },
      moderator: {
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
      },
    },
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

export type SessionTeamMemberRole = 'TRAINER' | 'MODERATOR' | 'LEARNER';

function resolveSessionMemberRole(
  team: TeamRow,
  userId: string,
): SessionTeamMemberRole | null {
  if (!team.formationSessionId) return null;
  const session = team.formationSession;
  if (!session) return null;
  if (team.leaderId === userId || session.trainerUserId === userId) return 'TRAINER';
  if (session.moderatorUserId === userId) return 'MODERATOR';
  return 'LEARNER';
}

export function serializeTeam(team: TeamRow) {
  const isSessionTeam = Boolean(team.formationSessionId);

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
    formationSessionId: team.formationSessionId,
    lifecycleStatus: team.lifecycleStatus,
    lifecycleClosedAt: team.lifecycleClosedAt,
    isSessionTeam,
    leader: team.leader
      ? {
          id: team.leader.id,
          firstName: team.leader.firstName,
          lastName: team.leader.lastName,
          email: team.leader.email,
          avatar: team.leader.avatar,
          name:
            [team.leader.firstName, team.leader.lastName].filter(Boolean).join(' ').trim() ||
            team.leader.email,
        }
      : null,
    formationSession: team.formationSession
      ? {
          id: team.formationSession.id,
          dateDisplayLabel: team.formationSession.dateDisplayLabel,
          trainerUserId: team.formationSession.trainerUserId,
          moderatorUserId: team.formationSession.moderatorUserId,
          formation: team.formationSession.formation,
          trainer: team.formationSession.trainer
            ? {
                id: team.formationSession.trainer.id,
                firstName: team.formationSession.trainer.firstName,
                lastName: team.formationSession.trainer.lastName,
                email: team.formationSession.trainer.email,
                avatar: team.formationSession.trainer.avatar,
                name:
                  [
                    team.formationSession.trainer.firstName,
                    team.formationSession.trainer.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || team.formationSession.trainer.email,
              }
            : null,
          moderator: team.formationSession.moderator
            ? {
                id: team.formationSession.moderator.id,
                firstName: team.formationSession.moderator.firstName,
                lastName: team.formationSession.moderator.lastName,
                email: team.formationSession.moderator.email,
                avatar: team.formationSession.moderator.avatar,
                name:
                  [
                    team.formationSession.moderator.firstName,
                    team.formationSession.moderator.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || team.formationSession.moderator.email,
              }
            : null,
        }
      : null,
    Site: team.site,
    orgUnit: team.orgUnit,
    OrgUnit: team.orgUnit,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    members: team.members.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      tenantUserId: m.userId,
      sessionRole: resolveSessionMemberRole(team, m.userId),
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
