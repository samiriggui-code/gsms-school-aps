import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isoDateOnly } from '@/lib/suivi-formations/session-days';
import { loadSuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string }> };

/** Contexte structuré pour le dépôt document (session, formateur, jours journal). */
export async function GET(_request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId } = await context.params;

  try {
    const [sessionContext, days] = await Promise.all([
      loadSuiviSessionContext(sessionId),
      prisma.formationSessionDay.findMany({
        where: { sessionId },
        orderBy: { dayDate: 'asc' },
        select: { id: true, dayDate: true },
      }),
    ]);
    if (!sessionContext) return fail('Session introuvable.', 404);

    return ok({
      sessionContext,
      journalDays: days.map((d) => ({
        id: d.id,
        dayDate: isoDateOnly(d.dayDate),
      })),
    });
  } catch (error) {
    return fail('Impossible de charger le contexte de dépôt.', 500, error);
  }
}
