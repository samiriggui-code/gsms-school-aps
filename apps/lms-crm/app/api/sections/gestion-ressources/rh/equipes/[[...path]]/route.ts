import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NotificationService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { nullishId, serializeTeam, teamInclude } from '../../_lib/rh-teams-serialize';

type Params = { params: Promise<{ path?: string[] }> };

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

function parseTeamBody(body: Record<string, unknown>) {
  const memberIds = Array.isArray(body.memberIds)
    ? (body.memberIds as string[]).filter(Boolean)
    : [];
  return {
    name: String(body.name ?? '').trim(),
    description: body.description ? String(body.description).trim() : null,
    type: String(body.type ?? 'SECURITE').trim() || 'SECURITE',
    sector: String(body.sector ?? 'CLIENT').trim() || 'CLIENT',
    image: body.image ? String(body.image) : null,
    siteId: nullishId(body.siteId),
    orgUnitId: nullishId(body.orgUnitId),
    leaderId: nullishId(body.leaderId),
    memberIds,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireSession())) return fail('Unauthorized request', 401);

  const parts = (await params).path ?? [];
  const joined = parts.join('/');
  const url = new URL(request.url);

  try {
    if (joined === 'statistics' || joined === 'stats') {
      const [total, memberRows] = await Promise.all([
        prisma.rhTeam.count(),
        prisma.rhTeamMember.findMany({ select: { teamId: true } }),
      ]);
      const members = memberRows.length;
      const avgSize = total > 0 ? Math.round((members / total) * 10) / 10 : 0;
      return ok({
        total: { value: total },
        active: { value: total },
        members: { value: members },
        avgSize: { value: avgSize },
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

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { type: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

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
    });
  } catch (error) {
    return fail('Impossible de charger les équipes.', 500, error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!(await requireSession())) return fail('Unauthorized request', 401);

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
      const notifier = new NotificationService(prisma);
      for (const memberId of body.memberIds) {
        await notifier.emit({
          userId: memberId,
          category: 'TEAM',
          title: 'Ajout à une équipe',
          body: `Vous avez été ajouté à l'équipe « ${team.name} ».`,
          href: '/gestion-ressources/rh/equipes',
          dedupeKey: `rh-team-member:${team.id}:${memberId}`,
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
  if (!(await requireSession())) return fail('Unauthorized request', 401);

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
  if (!(await requireSession())) return fail('Unauthorized request', 401);

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
