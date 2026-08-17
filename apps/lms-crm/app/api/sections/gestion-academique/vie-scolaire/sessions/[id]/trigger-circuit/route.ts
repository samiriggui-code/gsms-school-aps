import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  createWorkflowEngine,
  fetchSessionTimeline,
  resolveStandardWebhookUrl,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  const sessionId = id?.trim();
  if (!sessionId) return fail('Session id requis', 400);

  const timeline = await fetchSessionTimeline(prisma, sessionId);
  if (!timeline) return fail('Session introuvable', 404);

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    /* corps optionnel */
  }

  const participantId =
    typeof body.participantId === 'string' ? body.participantId.trim() : undefined;
  const participant =
    timeline.participants.find((p) => p.participantId === participantId) ??
    timeline.participants[0];

  if (!participant) {
    return fail('Aucun participant inscrit sur cette session', 422);
  }

  const webhookUrl = resolveStandardWebhookUrl();
  if (!webhookUrl) {
    return fail('Automatisation n8n non configurée (N8N_WEBHOOK_STANDARD_URL)', 503);
  }

  const workflows = createWorkflowEngine(prisma);
  await workflows.emit(
    'crm.candidature.session.enrolled',
    {
      participantId: participant.participantId,
      sessionId: timeline.sessionId,
      sessionLabel: timeline.label,
      candidatureId: participant.candidatureId,
      userId: participant.userId,
      candidateName: participant.name ?? 'Participant',
      email: participant.email ?? null,
      fundingMode: participant.fundingMode ?? null,
      enrollmentStatus: participant.enrollmentStatus ?? 'CONFIRMED',
      triggeredManually: true,
      circuitKey: typeof body.circuitKey === 'string' ? body.circuitKey : 'default',
    },
    { dedupeKey: `workflow:circuit-manual:${sessionId}:${participant.participantId}:${Date.now()}` },
  );

  return ok({
    triggered: true,
    sessionId,
    participantId: participant.participantId,
    milestoneCount: timeline.milestones.length,
    webhookConfigured: Boolean(webhookUrl),
  });
}
