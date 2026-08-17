import { NextRequest } from 'next/server';
import {
  dispatchStandardWebhook,
  fetchSessionTimeline,
  resolveStandardWebhookUrl,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';

export async function POST(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide', 400);
  }

  if (!body || typeof body !== 'object') return fail('Payload invalide', 400);
  const raw = body as Record<string, unknown>;
  const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId.trim() : '';
  if (!sessionId) return fail('sessionId requis', 400);

  const timeline = await fetchSessionTimeline(prisma, sessionId);
  if (!timeline) return fail('Session introuvable', 404);

  const participantId = typeof raw.participantId === 'string' ? raw.participantId : undefined;
  const participant =
    timeline.participants.find((p) => p.participantId === participantId) ??
    timeline.participants[0];

  const webhookUrl = resolveStandardWebhookUrl();
  if (!webhookUrl) {
    return fail('N8N_WEBHOOK_STANDARD_URL non configuré', 503);
  }

  await dispatchStandardWebhook('crm.candidature.session.enrolled', {
    sessionId: timeline.sessionId,
    sessionLabel: timeline.label,
    participantId: participant?.participantId,
    candidatureId: participant?.candidatureId,
    userId: participant?.userId,
    candidateName: participant?.name ?? 'Participant',
    enrollmentStatus: participant?.enrollmentStatus ?? 'CONFIRMED',
    triggeredManually: true,
    circuitKey: typeof raw.circuitKey === 'string' ? raw.circuitKey : 'default',
  });

  return ok({
    triggered: true,
    webhookUrl,
    sessionId,
    milestoneCount: timeline.milestones.length,
  });
}
