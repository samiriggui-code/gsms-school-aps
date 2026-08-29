import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import type { AiRunStatus, Prisma } from '@repo/database';

const RUN_STATUSES = new Set<AiRunStatus>(['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED']);

/** Journal AiRun — page historique IA. */
export async function GET(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.pilotageView);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const page = Math.max(Number(sp.get('page') ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 25) || 25, 1), 100);
  const skip = (page - 1) * limit;
  const useCase = sp.get('useCase')?.trim();
  const statusRaw = sp.get('status');

  const where: Prisma.AiRunWhereInput = {};
  if (useCase) where.useCase = useCase;
  if (statusRaw && RUN_STATUSES.has(statusRaw as AiRunStatus)) {
    where.status = statusRaw as AiRunStatus;
  }

  try {
    const [total, rows] = await Promise.all([
      prisma.aiRun.count({ where }),
      prisma.aiRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          useCase: true,
          status: true,
          provider: true,
          model: true,
          promptTokens: true,
          completionTokens: true,
          errorMessage: true,
          createdAt: true,
          completedAt: true,
          _count: { select: { artifacts: true } },
        },
      }),
    ]);

    return ok({
      items: rows.map((r) => ({
        id: r.id,
        useCase: r.useCase,
        status: r.status,
        provider: r.provider,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        errorMessage: r.errorMessage,
        artifactCount: r._count.artifacts,
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      pagination: { total, page, limit },
    });
  } catch (e) {
    return fail('Lecture AiRun impossible.', 500, e);
  }
}
