import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../_lib/require-gestion-ressources-auth';

/** Timeline ComplianceItemEvent — dossiers SCHOOL_QUALIOPI uniquement. */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const page = Math.max(Number(sp.get('page') ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit') ?? 25) || 25, 1), 100);
  const skip = (page - 1) * limit;
  const eventType = sp.get('eventType')?.trim();

  const where = {
    dossier: { kind: 'SCHOOL_QUALIOPI' as const },
    ...(eventType ? { eventType } : {}),
  };

  try {
    const [total, rows] = await Promise.all([
      prisma.complianceItemEvent.count({ where }),
      prisma.complianceItemEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          createdAt: true,
          payload: true,
          dossierItem: {
            select: { id: true, code: true, label: true, status: true },
          },
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const koOpen = await prisma.complianceDossierItem.count({
      where: {
        dossier: { kind: 'SCHOOL_QUALIOPI' },
        status: { in: ['REJECTED', 'REQUESTED'] },
      },
    });

    return ok({
      items: rows.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        createdAt: r.createdAt.toISOString(),
        payload: r.payload,
        itemCode: r.dossierItem?.code ?? null,
        itemLabel: r.dossierItem?.label ?? null,
        itemStatus: r.dossierItem?.status ?? null,
        itemId: r.dossierItem?.id ?? null,
        actorName: r.actor?.name ?? r.actor?.email ?? null,
      })),
      pagination: { total, page, limit },
      summary: { totalEvents: total, openIssues: koOpen },
    });
  } catch (e) {
    return fail('Lecture historique Qualiopi impossible.', 500, e);
  }
}
