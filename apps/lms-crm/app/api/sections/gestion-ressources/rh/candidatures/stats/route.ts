import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { CandidatureStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

try {
    const grouped = await prisma.candidature.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const byStatus = grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    const [total, validated, pendingCnaps, inSessionDraft] = await Promise.all([
      prisma.candidature.count(),
      prisma.candidature.count({ where: { status: CandidatureStatus.VALIDATED } }),
      prisma.candidature.count({ where: { status: CandidatureStatus.PENDING_CNAPS } }),
      prisma.candidature.count({
        where: { status: { not: CandidatureStatus.VALIDATED } },
      }),
    ]);

    return ok({
      total,
      validated,
      pendingCnaps,
      notYetValidated: inSessionDraft,
      byStatus,
    });
  } catch (error) {
    return fail('Impossible de charger les statistiques candidatures.', 500, error);
  }
}
