import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService, complianceDossierLabel, complianceSubjectTypeLabel } from '@repo/api-core';
import {
  complianceDossierCrmPath,
  complianceDossierEditPath,
  complianceDossierGedPath,
} from '@/lib/governance/compliance-dossier-links';
import type { Prisma } from '@repo/database';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

const ACTIONABLE_ITEM_STATUSES = ['MISSING', 'REJECTED', 'EXPIRED', 'REQUESTED'] as const;

function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string | null;
}): string {
  return (
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || user.email || '—'
  );
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.storageAdmin)) {
    return fail('Forbidden', 403);
  }

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const evaluate = sp.get('evaluate') === '1';

  const dossierWhere: Prisma.ComplianceDossierWhereInput = {
    status: { in: ['INCOMPLETE', 'EXPIRED'] },
    items: {
      some: {
        required: true,
        status: { in: [...ACTIONABLE_ITEM_STATUSES] },
      },
    },
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { candidature: { formation: { name: { contains: q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  try {
    const compliance = new ComplianceService(prisma);

    const [total, missingItems, openRequests, requestedItems, profiles, rows] = await Promise.all([
      prisma.complianceDossier.count({ where: dossierWhere }),
      prisma.complianceDossierItem.count({
        where: {
          required: true,
          status: { in: ['MISSING', 'REJECTED', 'EXPIRED'] },
          dossier: dossierWhere,
        },
      }),
      prisma.documentRequest.count({
        where: { status: 'OPEN', dossier: dossierWhere },
      }),
      prisma.complianceDossierItem.count({
        where: {
          required: true,
          status: 'REQUESTED',
          dossier: dossierWhere,
        },
      }),
      prisma.complianceDossier.groupBy({
        by: ['subjectType'],
        where: dossierWhere,
        _count: { _all: true },
      }).then((g) => g.length),
      prisma.complianceDossier.findMany({
        where: dossierWhere,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          kind: true,
          subjectType: true,
          subjectId: true,
          status: true,
          completenessPct: true,
          updatedAt: true,
          userId: true,
          candidatureId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
            },
          },
          candidature: {
            select: {
              id: true,
              formation: { select: { name: true } },
            },
          },
          items: {
            where: {
              required: true,
              status: { in: [...ACTIONABLE_ITEM_STATUSES] },
            },
            select: { label: true, status: true },
            orderBy: { code: 'asc' },
          },
        },
      }),
    ]);

    let dossierRows = rows;
    if (evaluate && rows.length > 0) {
      await Promise.all(rows.map((row) => compliance.evaluateDossier(row.id).catch(() => null)));
      dossierRows = await prisma.complianceDossier.findMany({
        where: { id: { in: rows.map((r) => r.id) } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          kind: true,
          subjectType: true,
          subjectId: true,
          status: true,
          completenessPct: true,
          updatedAt: true,
          userId: true,
          candidatureId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true,
            },
          },
          candidature: {
            select: {
              id: true,
              formation: { select: { name: true } },
            },
          },
          items: {
            where: {
              required: true,
              status: { in: [...ACTIONABLE_ITEM_STATUSES] },
            },
            select: { label: true, status: true },
            orderBy: { code: 'asc' },
          },
        },
      });
    }

    const items = dossierRows.map((row) => {
      const personName = row.user ? displayName(row.user) : '—';
      const email = row.user?.email ?? '—';
      const missingPieces = row.items
        .filter((i) => ['MISSING', 'REJECTED', 'EXPIRED'].includes(i.status))
        .map((i) => i.label);
      const requestedCount = row.items.filter((i) => i.status === 'REQUESTED').length;
      const userId = row.user?.id ?? row.userId;

      return {
        id: row.id,
        dossierKind: row.kind,
        dossierKindLabel: complianceDossierLabel(row.kind),
        subjectType: row.subjectType,
        subjectTypeLabel: complianceSubjectTypeLabel(row.subjectType),
        subjectId: row.subjectId,
        personName,
        email,
        contextLabel: row.candidature?.formation?.name ?? complianceDossierLabel(row.kind),
        missingPieces,
        missingCount: missingPieces.length,
        requestedCount,
        completenessPct: row.completenessPct,
        dossierStatus: row.status,
        updatedAt: row.updatedAt.toISOString(),
        gedPath: userId ? complianceDossierGedPath(userId, personName) : '#',
        editPath: complianceDossierEditPath({
          subjectType: row.subjectType,
          candidatureId: row.candidatureId,
          userId,
          subjectId: row.subjectId,
          personName,
        }),
        crmPath: complianceDossierCrmPath(row.candidatureId),
        userId: userId ?? null,
        candidatureId: row.candidatureId,
      };
    });

    return ok({
      stats: { total, missingItems, openRequests, requestedItems, profiles },
      items,
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les demandes.', 500, e);
  }
}
