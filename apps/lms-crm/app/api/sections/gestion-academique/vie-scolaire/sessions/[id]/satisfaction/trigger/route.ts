import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { ensureSurveysForSession, sendSurveyInvite } from '@/lib/of/satisfaction-survey-service';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Déclenchement manuel des enquêtes d'une session : crée HOT/COLD (participants)
 * + COMPANY/TRAINER/FUNDER (session), envoie les invitations HOT et stakeholders
 * nouvellement créés (COLD part au cron J+45).
 */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  const sessionId = id?.trim();
  if (!sessionId) return fail('Session id requis', 400);

  const row = await prisma.formationSession.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!row) return fail('Session introuvable.', 404);

  const ensured = await ensureSurveysForSession(prisma, sessionId);

  let sent = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  const toInvite = [...ensured.createdHotIds, ...ensured.createdStakeholderIds];
  for (const surveyId of toInvite) {
    const result = await sendSurveyInvite(prisma, surveyId, request);
    if (result.sent) {
      sent += 1;
    } else {
      skipped += 1;
      if (result.skippedReason) skippedReasons.push(result.skippedReason);
    }
  }

  return ok({
    sessionId,
    participantsCount: ensured.participantsCount,
    surveysCreated:
      ensured.createdHotIds.length +
      ensured.createdColdIds.length +
      ensured.createdStakeholderIds.length,
    invitesSent: sent,
    invitesSkipped: skipped,
    skippedReasons,
  });
}
