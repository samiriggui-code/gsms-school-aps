import { NextRequest } from 'next/server';
import { NotificationService } from '@repo/api-core';
import type { Prisma, RhTeamSector } from '@repo/database';
import { RhTeamType } from '@repo/database';

type RhTeamTypeValue = (typeof RhTeamType)[keyof typeof RhTeamType];
import {
  ensureRhTeamStoragePrefix,
  provisionStoragePrefixSafe,
} from '@/lib/entity-storage';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { nullishId, serializeTeam, teamInclude } from '../../_lib/rh-teams-serialize';
import { PERMANENT_SCHOOL_TEAM_TYPES } from '@/lib/rh-team-list-scope';
import { requireGestionRessourcesForMethod } from '../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ path?: string[] }> };

const RH_TEAM_TYPE_VALUES: RhTeamTypeValue[] = [
  'DIRECTION',
  'PEDAGOGICAL',
  'TRAINER_POOL',
  'HR_ADMIN',
  'QUALITY',
  'ADMIN',
];

const RH_TEAM_SECTOR_VALUES: RhTeamSector[] = ['HEADQUARTERS', 'CAMPUS', 'EXTERNAL'];

const LEGACY_TEAM_TYPE_MAP: Record<string, RhTeamTypeValue> = {
  SECURITE: 'QUALITY',
  INCENDIE: 'QUALITY',
  VOLANTE: 'TRAINER_POOL',
  CYNOPHILE: 'TRAINER_POOL',
};

const LEGACY_TEAM_SECTOR_MAP: Record<string, RhTeamSector> = {
  SIEGE: 'HEADQUARTERS',
  SUCCURSALE: 'CAMPUS',
  CLIENT: 'EXTERNAL',
};

function parseRhTeamType(value: unknown): RhTeamTypeValue {
  const raw = String(value ?? 'PEDAGOGICAL').trim().toUpperCase();
  if (LEGACY_TEAM_TYPE_MAP[raw]) return LEGACY_TEAM_TYPE_MAP[raw];
  return RH_TEAM_TYPE_VALUES.includes(raw as RhTeamTypeValue)
    ? (raw as RhTeamTypeValue)
    : 'PEDAGOGICAL';
}

function parseRhTeamSector(value: unknown): RhTeamSector {
  const raw = String(value ?? 'CAMPUS').trim().toUpperCase();
  if (LEGACY_TEAM_SECTOR_MAP[raw]) return LEGACY_TEAM_SECTOR_MAP[raw];
  return RH_TEAM_SECTOR_VALUES.includes(raw as RhTeamSector)
    ? (raw as RhTeamSector)
    : 'CAMPUS';
}

function teamTypesMatchingQuery(q: string): RhTeamTypeValue[] {
  const needle = q.toLowerCase();
  return RH_TEAM_TYPE_VALUES.filter(
    (type) =>
      type.toLowerCase().includes(needle) ||
      type.replace(/_/g, ' ').toLowerCase().includes(needle),
  );
}

function buildTeamListWhere(q: string): Prisma.RhTeamWhereInput {
  const or: Prisma.RhTeamWhereInput[] = [
    { name: { contains: q, mode: 'insensitive' } },
    { description: { contains: q, mode: 'insensitive' } },
  ];
  const types = teamTypesMatchingQuery(q);
  if (types.length > 0) {
    or.push({ type: { in: types } });
  }
  or.push({
    formationSession: {
      formation: { name: { contains: q, mode: 'insensitive' } },
    },
  });
  return { OR: or };
}

/** permanent = structure école ; session = équipes liées à une session catalogue. */
function buildTeamScopeWhere(
  teamScope: string,
  sessionPhase: string,
): Prisma.RhTeamWhereInput {
  if (teamScope === 'session') {
    const base: Prisma.RhTeamWhereInput = { formationSessionId: { not: null } };
    switch (sessionPhase) {
      case 'active':
        return { ...base, lifecycleStatus: 'ACTIVE' };
      case 'post_exam':
        return { ...base, lifecycleStatus: 'POST_EXAM' };
      case 'archived':
        return { ...base, lifecycleStatus: 'ARCHIVED' };
      case 'all':
        return base;
      case 'running':
      default:
        return { ...base, lifecycleStatus: { in: ['ACTIVE', 'POST_EXAM'] } };
    }
  }
  return {
    formationSessionId: null,
    type: { in: PERMANENT_SCHOOL_TEAM_TYPES },
  };
}

function mergeTeamWhere(
  ...clauses: Array<Prisma.RhTeamWhereInput | undefined>
): Prisma.RhTeamWhereInput {
  const parts = clauses.filter(Boolean) as Prisma.RhTeamWhereInput[];
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { AND: parts };
}

async function requireSession(method: string) {
  const auth = await requireGestionRessourcesForMethod(method);
  if (!auth.ok) return { session: null, response: auth.response };
  return { session: auth.session, response: null };
}

function parseTeamBody(body: Record<string, unknown>) {
  const memberIds = Array.isArray(body.memberIds)
    ? (body.memberIds as string[]).filter(Boolean)
    : [];
  return {
    name: String(body.name ?? '').trim(),
    description: body.description ? String(body.description).trim() : null,
    type: parseRhTeamType(body.type),
    sector: parseRhTeamSector(body.sector),
    image: body.image ? String(body.image) : null,
    siteId: nullishId(body.siteId),
    orgUnitId: nullishId(body.orgUnitId),
    leaderId: nullishId(body.leaderId),
    memberIds,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireSession(request.method);
  if (!auth.session) return auth.response!;

  const parts = (await params).path ?? [];
  const joined = parts.join('/');
  const url = new URL(request.url);

  try {
    if (joined === 'statistics' || joined === 'stats') {
      const teamScope = (url.searchParams.get('teamScope') || 'permanent').trim();
      const sessionPhase = (url.searchParams.get('sessionPhase') || 'running').trim();
      const scopeWhere = buildTeamScopeWhere(teamScope, sessionPhase);

      const sessionBaseWhere = buildTeamScopeWhere('session', 'all');

      const [total, memberRows, withoutLeader, postExamCount, archivedCount] = await Promise.all([
        prisma.rhTeam.count({ where: scopeWhere }),
        prisma.rhTeamMember.findMany({
          where: { team: scopeWhere },
          select: { teamId: true },
        }),
        prisma.rhTeam.count({
          where: mergeTeamWhere(scopeWhere, { leaderId: null }),
        }),
        prisma.rhTeam.count({
          where: mergeTeamWhere(sessionBaseWhere, { lifecycleStatus: 'POST_EXAM' }),
        }),
        prisma.rhTeam.count({
          where: mergeTeamWhere(sessionBaseWhere, { lifecycleStatus: 'ARCHIVED' }),
        }),
      ]);
      const members = memberRows.length;
      const avgSize = total > 0 ? Math.round((members / total) * 10) / 10 : 0;

      let activeCount = total;
      if (teamScope === 'session') {
        activeCount = await prisma.rhTeam.count({
          where: mergeTeamWhere(scopeWhere, { lifecycleStatus: 'ACTIVE' }),
        });
      }

      return ok({
        total: { value: total },
        active: { value: activeCount },
        members: { value: members },
        avgSize: { value: avgSize },
        withoutLeader: { value: withoutLeader },
        postExam: { value: postExamCount },
        archived: { value: archivedCount },
        teamScope,
      });
    }

    if (parts.length === 1 && parts[0]) {
      const team = await prisma.rhTeam.findUnique({
        where: { id: parts[0] },
        include: teamInclude,
      });
      if (!team) return fail('Équipe introuvable', 404);
      return ok(serializeTeam(team));
    }

    if (parts.length === 2 && parts[0] && parts[1] === 'metrics') {
      const team = await prisma.rhTeam.findUnique({
        where: { id: parts[0] },
        include: { _count: { select: { members: true } } },
      });
      if (!team) return fail('Équipe introuvable', 404);
      return ok({
        memberCount: team._count.members,
        updatedAt: team.updatedAt,
      });
    }

    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const q = (url.searchParams.get('query') || url.searchParams.get('q') || '').trim();
    const teamScope = (url.searchParams.get('teamScope') || 'permanent').trim();
    const sessionPhase = (url.searchParams.get('sessionPhase') || 'running').trim();

    const where = mergeTeamWhere(
      buildTeamScopeWhere(teamScope, sessionPhase),
      q ? buildTeamListWhere(q) : undefined,
    );

    const [total, rows] = await Promise.all([
      prisma.rhTeam.count({ where }),
      prisma.rhTeam.findMany({
        where,
        include: teamInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      items: rows.map(serializeTeam),
      pagination: { page, limit, total },
      teamScope,
    });
  } catch (error) {
    return fail('Impossible de charger les équipes.', 500, error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSession(request.method);
  if (!auth.session) return auth.response!;

  const parts = (await params).path ?? [];
  const teamId = parts[0];
  if (!teamId) {
    try {
      const body = parseTeamBody((await request.json()) as Record<string, unknown>);
      if (body.name.length < 2) return fail('Le nom est requis.', 400);

      const team = await prisma.rhTeam.create({
        data: {
          name: body.name,
          description: body.description,
          type: body.type,
          sector: body.sector,
          image: body.image,
          siteId: body.siteId,
          orgUnitId: body.orgUnitId,
          leaderId: body.leaderId,
          members: body.memberIds.length
            ? {
                create: body.memberIds.map((userId) => ({ userId })),
              }
            : undefined,
        },
        include: teamInclude,
      });
      void provisionStoragePrefixSafe(`rh-equipe:${team.id}`, () =>
        ensureRhTeamStoragePrefix(team.id),
      );
      const notifier = new NotificationService(prisma);
      for (const memberId of body.memberIds) {
        await notifier.emit({
          userId: memberId,
          category: 'TEAM',
          title: 'Ajout à une équipe',
          body: `Vous avez été ajouté à l'équipe « ${team.name} ».`,
          href: '/gestion-ressources/rh/equipes',
          dedupeKey: `rh-team-member:${team.id}:${memberId}`,
          metadata: {
            moduleKey: 'gestion-ressources.rh',
            eventType: 'rh.team.member_added',
            teamId: team.id,
            teamName: team.name,
          },
        });
      }
      return ok(serializeTeam(team), 201);
    } catch (error) {
      return fail('Impossible de créer l\'équipe.', 500, error);
    }
  }

  if (parts[1] === 'members') {
    try {
      const { tenantUserId } = (await request.json()) as { tenantUserId?: string };
      const userId = String(tenantUserId ?? '').trim();
      if (!userId) return fail('Collaborateur requis.', 400);

      const teamMeta = await prisma.rhTeam.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });
      if (!teamMeta) return fail('Équipe introuvable', 404);

      await prisma.rhTeamMember.create({
        data: { teamId, userId },
      });

      const notifier = new NotificationService(prisma);
      await notifier.emit({
        userId,
        category: 'TEAM',
        title: 'Ajout à une équipe',
        body: `Vous avez été ajouté à l'équipe « ${teamMeta.name} ».`,
        href: '/gestion-ressources/rh/equipes',
        dedupeKey: `rh-team-member:${teamId}:${userId}`,
        metadata: {
          moduleKey: 'gestion-ressources.rh',
          eventType: 'rh.team.member_added',
          teamId: teamMeta.id,
          teamName: teamMeta.name,
        },
      });

      const team = await prisma.rhTeam.findUnique({
        where: { id: teamId },
        include: teamInclude,
      });
      if (!team) return fail('Équipe introuvable', 404);
      return ok(serializeTeam(team));
    } catch (error) {
      return fail('Impossible d\'ajouter le membre.', 500, error);
    }
  }

  return fail('Route non supportée', 404);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireSession(request.method);
  if (!auth.session) return auth.response!;

  const parts = (await params).path ?? [];
  const teamId = parts[0];
  if (!teamId) return fail('Identifiant requis', 400);

  try {
    const body = parseTeamBody((await request.json()) as Record<string, unknown>);
    if (body.name.length < 2) return fail('Le nom est requis.', 400);

    await prisma.$transaction([
      prisma.rhTeamMember.deleteMany({ where: { teamId } }),
      prisma.rhTeam.update({
        where: { id: teamId },
        data: {
          name: body.name,
          description: body.description,
          type: body.type,
          sector: body.sector,
          image: body.image,
          siteId: body.siteId,
          orgUnitId: body.orgUnitId,
          leaderId: body.leaderId,
          members: {
            create: body.memberIds.map((userId) => ({ userId })),
          },
        },
      }),
    ]);

    const team = await prisma.rhTeam.findUnique({
      where: { id: teamId },
      include: teamInclude,
    });
    if (!team) return fail('Équipe introuvable', 404);
    return ok(serializeTeam(team));
  } catch (error) {
    return fail('Impossible de mettre à jour l\'équipe.', 500, error);
  }
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return PUT(request, ctx);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireSession(request.method);
  if (!auth.session) return auth.response!;

  const parts = (await params).path ?? [];
  const teamId = parts[0];
  if (!teamId) return fail('Identifiant requis', 400);

  const url = new URL(request.url);
  const tenantUserId = url.searchParams.get('tenantUserId');

  try {
    if (parts[1] === 'members' && tenantUserId) {
      await prisma.rhTeamMember.deleteMany({
        where: { teamId, userId: tenantUserId },
      });
      const team = await prisma.rhTeam.findUnique({
        where: { id: teamId },
        include: teamInclude,
      });
      if (!team) return fail('Équipe introuvable', 404);
      return ok(serializeTeam(team));
    }

    await prisma.rhTeam.delete({ where: { id: teamId } });
    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de supprimer.', 500, error);
  }
}
