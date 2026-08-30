import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string; participantId: string }> };

/** WF-08 — convention du participant pour cette session (lecture). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId, participantId } = await context.params;
  const row = await prisma.formationSessionConvention.findUnique({
    where: {
      sessionId_participantId: { sessionId, participantId },
    },
    select: {
      id: true,
      status: true,
      sentAt: true,
      viewedAt: true,
      signedAt: true,
      reminderCount: true,
      lastReminderAt: true,
    },
  });

  if (!row) return ok({ convention: null });

  return ok({
    convention: {
      ...row,
      sentAt: row.sentAt?.toISOString() ?? null,
      viewedAt: row.viewedAt?.toISOString() ?? null,
      signedAt: row.signedAt?.toISOString() ?? null,
      lastReminderAt: row.lastReminderAt?.toISOString() ?? null,
    },
  });
}
