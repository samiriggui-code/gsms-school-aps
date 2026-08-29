import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/app/api/_shared/http/response';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import {
  ensureSurveysForSession,
  sendSurveyInvite,
} from '@/lib/of/satisfaction-survey-service';

const BATCH_SESSIONS = 50;
const BATCH_INVITES = 100;

/** Requête synthétique (headers seuls) — même pattern que satisfaction-cold-followup. */
function envOriginRequestLike(): Pick<NextRequest, 'headers'> {
  const raw = process.env.NEXTAUTH_URL?.trim() || '';
  let host = 'localhost';
  let proto = 'http';
  if (raw) {
    try {
      const u = new URL(raw);
      host = u.host;
      proto = u.protocol.replace(':', '');
    } catch {
      /* NEXTAUTH_URL absent ou invalide — repli localhost */
    }
  }
  const headers = new Headers();
  headers.set('host', host);
  headers.set('x-forwarded-proto', proto);
  return { headers };
}

function yesterdayRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Cron P0 (WF-27) : sessions dont `endDate` tombe hier → ensure HOT/COLD manquantes,
 * puis envoi des invitations HOT encore PENDING. Le jalon n8n jFin reste notify-only.
 */
export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const { start, end } = yesterdayRange();

  const sessions = await prisma.formationSession.findMany({
    where: {
      endDate: { gte: start, lt: end },
    },
    orderBy: { endDate: 'asc' },
    take: BATCH_SESSIONS,
    select: { id: true },
  });

  let participantsCount = 0;
  let surveysCreated = 0;
  const hotIdsToInvite: string[] = [];

  for (const session of sessions) {
    const ensured = await ensureSurveysForSession(prisma, session.id);
    participantsCount += ensured.participantsCount;
    surveysCreated +=
      ensured.createdHotIds.length +
      ensured.createdColdIds.length +
      ensured.createdStakeholderIds.length;

    const pendingHot = await prisma.satisfactionSurvey.findMany({
      where: {
        sessionId: session.id,
        timing: 'HOT',
        status: 'PENDING',
      },
      select: { id: true },
      take: BATCH_INVITES,
    });
    for (const row of pendingHot) {
      if (hotIdsToInvite.length >= BATCH_INVITES) break;
      hotIdsToInvite.push(row.id);
    }
    if (hotIdsToInvite.length >= BATCH_INVITES) break;
  }

  const requestLike = envOriginRequestLike();
  let sent = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  for (const surveyId of hotIdsToInvite) {
    const result = await sendSurveyInvite(prisma, surveyId, requestLike);
    if (result.sent) {
      sent += 1;
    } else {
      skipped += 1;
      if (result.skippedReason) skippedReasons.push(result.skippedReason);
    }
  }

  return ok({
    sessionsConsidered: sessions.length,
    participantsCount,
    surveysCreated,
    candidates: hotIdsToInvite.length,
    invitesSent: sent,
    invitesSkipped: skipped,
    skippedReasons,
    window: { start: start.toISOString(), end: end.toISOString() },
  });
}
