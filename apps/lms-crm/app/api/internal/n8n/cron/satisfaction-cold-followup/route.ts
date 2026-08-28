import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/app/api/_shared/http/response';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import { sendSurveyInvite } from '@/lib/of/satisfaction-survey-service';

const BATCH_LIMIT = 100;
const COLD_DELAY_MS = 45 * 24 * 60 * 60 * 1000;

/** Requête synthétique (headers seuls) pour construire le lien public depuis NEXTAUTH_URL — un
 * appel cron n8n ne porte pas forcément le bon Host public pour le lien envoyé au stagiaire. */
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

/**
 * Cron J+45 : envoie l'enquête « à froid » pour les lignes COLD encore PENDING dont
 * la session s'est terminée il y a au moins 45 jours.
 */
export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const threshold = new Date(Date.now() - COLD_DELAY_MS);

  const candidates = await prisma.satisfactionSurvey.findMany({
    where: {
      timing: 'COLD',
      status: 'PENDING',
      session: { endDate: { lte: threshold } },
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_LIMIT,
    select: { id: true },
  });

  const requestLike = envOriginRequestLike();
  let sent = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  for (const candidate of candidates) {
    const result = await sendSurveyInvite(prisma, candidate.id, requestLike);
    if (result.sent) {
      sent += 1;
    } else {
      skipped += 1;
      if (result.skippedReason) skippedReasons.push(result.skippedReason);
    }
  }

  return ok({
    candidates: candidates.length,
    invitesSent: sent,
    invitesSkipped: skipped,
    skippedReasons,
  });
}
