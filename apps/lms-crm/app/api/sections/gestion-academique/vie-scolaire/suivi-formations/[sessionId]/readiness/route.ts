import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { SessionReadinessStatus } from '@repo/database';
import { nextSessionReadiness } from '@/lib/session/session-readiness-transitions';

const STATUSES = new Set(Object.values(SessionReadinessStatus));

type RouteParams = { params: Promise<{ sessionId: string }> };

/**
 * PATCH — transition readiness SD-06.
 * Body: `{ advance: true }` | `{ status }` + optionnel `{ forced, findingIds }`
 * Gardes : forçable ; finding reste ouvert (pas de hard-block).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId } = await params;
  try {
    const body = (await request.json()) as {
      status?: string;
      advance?: boolean;
      forced?: boolean;
      findingIds?: string[];
    };

    const existing = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      select: { id: true, readinessStatus: true },
    });
    if (!existing) return fail('FormationSession not found', 404);

    const fromStatus = existing.readinessStatus;
    let toStatus: SessionReadinessStatus | null = null;

    if (body.advance === true) {
      toStatus = nextSessionReadiness(fromStatus);
      if (!toStatus) return fail(`No next readiness from ${fromStatus}`, 400);
    } else if (body.status) {
      if (!STATUSES.has(body.status as SessionReadinessStatus)) {
        return fail('Invalid readiness status', 400);
      }
      toStatus = body.status as SessionReadinessStatus;
    } else {
      return fail('Provide advance or status', 400);
    }

    if (toStatus === fromStatus) return fail('Status unchanged', 400);

    const forced = body.forced === true;
    const findingIds = Array.isArray(body.findingIds) ? body.findingIds : [];

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.formationSession.update({
        where: { id: sessionId },
        data: { readinessStatus: toStatus! },
        select: { id: true, readinessStatus: true },
      });
      await tx.sessionReadinessEvent.create({
        data: {
          sessionId,
          fromStatus,
          toStatus: toStatus!,
          forced,
          source: 'ui',
          actorUserId: session.user?.id ?? null,
          payload: {
            action: body.advance ? 'advance' : 'set_status',
            findingIds,
            eventName: 'SESSION_STATUS_CHANGED',
          },
        },
      });
      await tx.evidence.create({
        data: {
          category: 'session_readiness',
          sourceType: 'HISTORIQUE',
          sourceId: sessionId,
          status: 'VALID',
          sessionId,
          eventName: 'SESSION_STATUS_CHANGED',
          metadata: { fromStatus, toStatus, forced, findingIds },
        },
      });
      return row;
    });

    return ok({
      id: updated.id,
      readinessStatus: updated.readinessStatus,
      fromStatus,
      toStatus: updated.readinessStatus,
      nextStatus: nextSessionReadiness(updated.readinessStatus),
      forced,
    });
  } catch (e) {
    console.error('[suivi-formations readiness] PATCH', e);
    return fail('Failed to transition session readiness', 500);
  }
}

/** GET — statut readiness + derniers events. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId } = await params;
  const row = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      readinessStatus: true,
      readinessEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!row) return fail('FormationSession not found', 404);

  return ok({
    ...row,
    nextStatus: nextSessionReadiness(row.readinessStatus),
  });
}
