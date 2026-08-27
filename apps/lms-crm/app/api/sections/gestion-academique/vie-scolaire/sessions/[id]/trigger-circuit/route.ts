import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  createWorkflowEngine,
  fetchSessionTimeline,
  resolveStandardWebhookUrl,
} from '@repo/api-core';
import { isEmailConfigured, sendSessionConvocationEmail } from '@repo/mail';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { buildSessionConvocationPdf } from '@/lib/vie-scolaire/session-convocation-pdf';
import { storeSessionConvocationPdfAsset } from '@/lib/vie-scolaire/session-convocation-store';

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
  const circuitKey = typeof body.circuitKey === 'string' ? body.circuitKey : 'default';

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
      circuitKey,
    },
    { dedupeKey: `workflow:circuit-manual:${sessionId}:${participant.participantId}:${Date.now()}` },
  );

  // Jalon « generate_and_send » réel : génère la convocation et l'envoie au participant,
  // au lieu de se limiter à une notification (GSMS-OF-03). N'échoue pas la requête si l'e-mail
  // ne peut pas être envoyé (pas d'adresse, canal non configuré) — c'est un résultat, pas une erreur serveur.
  let documentGenerated = false;
  let emailSent = false;
  let emailSkippedReason: string | null = null;
  let archivedFileAssetId: string | null = null;

  try {
    const { buffer, filename } = await buildSessionConvocationPdf({
      formationName: timeline.formation.name,
      sessionLabel: timeline.label,
      startDate: timeline.startDate ? new Date(timeline.startDate) : null,
      location: timeline.location,
      venueLabel: null,
      trainerName: timeline.trainer?.name ?? null,
      participants: [
        {
          participantId: participant.participantId,
          name: participant.name ?? 'Participant',
          email: participant.email ?? null,
        },
      ],
    });
    documentGenerated = true;

    if (session.user?.id) {
      try {
        const asset = await storeSessionConvocationPdfAsset({
          sessionId,
          buffer,
          filename,
          createdById: session.user.id,
          participantCount: 1,
        });
        archivedFileAssetId = asset.id;
      } catch (archiveError) {
        console.error('[trigger-circuit] archivage convocation', archiveError);
      }
    }

    if (!participant.email) {
      emailSkippedReason = 'Participant sans adresse e-mail.';
    } else if (!isEmailConfigured()) {
      emailSkippedReason = 'Canal e-mail non configuré (RESEND_API_KEY ou SMTP_HOST).';
    } else {
      await sendSessionConvocationEmail({
        to: participant.email,
        participantName: participant.name ?? 'Participant',
        formationName: timeline.formation.name,
        sessionLabel: timeline.label,
        location: timeline.location,
        organizationName: "FORM'SSI",
        pdfBuffer: buffer,
        pdfFilename: filename,
      });
      emailSent = true;
    }
  } catch (docError) {
    console.error('[trigger-circuit] génération/envoi convocation', docError);
    emailSkippedReason = 'Échec de génération du document.';
  }

  return ok({
    triggered: true,
    sessionId,
    participantId: participant.participantId,
    milestoneCount: timeline.milestones.length,
    webhookConfigured: Boolean(webhookUrl),
    circuitKey,
    documentGenerated,
    emailSent,
    emailSkippedReason,
    archivedFileAssetId,
  });
}
