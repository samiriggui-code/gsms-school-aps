import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import type { AiArtifactStatus, Prisma } from '@repo/database';

const STATUSES = new Set<AiArtifactStatus>(['PROPOSED', 'APPROVED', 'APPLIED', 'REJECTED']);

/** Liste paginée AiArtifact — hub IA (brouillons / filtres). */
export async function GET(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.pilotageView);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const statusRaw = sp.get('status');
  const page = Math.max(Number(sp.get('page') ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? sp.get('take') ?? 25) || 25, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.AiArtifactWhereInput = {};
  if (statusRaw && STATUSES.has(statusRaw as AiArtifactStatus)) {
    where.status = statusRaw as AiArtifactStatus;
  }

  try {
    const [total, items] = await Promise.all([
      prisma.aiArtifact.count({ where }),
      prisma.aiArtifact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          targetEntityType: true,
          targetEntityId: true,
          createdAt: true,
          appliedAt: true,
          reviewedAt: true,
          run: {
            select: {
              id: true,
              useCase: true,
              status: true,
              provider: true,
              model: true,
            },
          },
        },
      }),
    ]);

    return ok({
      items: items.map((row) => ({
        id: row.id,
        status: row.status,
        targetEntityType: row.targetEntityType,
        targetEntityId: row.targetEntityId,
        createdAt: row.createdAt.toISOString(),
        appliedAt: row.appliedAt?.toISOString() ?? null,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        useCase: row.run.useCase,
        runId: row.run.id,
        runStatus: row.run.status,
        provider: row.run.provider,
        model: row.run.model,
      })),
      pagination: { total, page, limit },
    });
  } catch (e) {
    return fail('Lecture artefacts IA impossible.', 500, e);
  }
}
