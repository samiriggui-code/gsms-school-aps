import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  isEmailConfigured,
  sendSessionAttestationEmail,
  sendSessionConventionEmail,
  sendSessionConvocationEmail,
} from '@repo/mail';
import { buildSessionConvocationPdf } from '@/lib/vie-scolaire/session-convocation-pdf';
import { storeSessionConvocationPdfAsset } from '@/lib/vie-scolaire/session-convocation-store';
import { buildSessionConventionPdf } from '@/lib/vie-scolaire/session-convention-pdf';
import { storeSessionConventionPdfAsset } from '@/lib/vie-scolaire/session-convention-store';
import { buildSessionCertificatePdf } from '@/lib/vie-scolaire/session-certificate-pdf';
import { storeSessionCertificatePdfAsset } from '@/lib/vie-scolaire/session-certificate-store';

type Ctx = { params: Promise<{ id: string }> };

type DocumentType = 'convocation' | 'convention' | 'attestation';

const DOCUMENT_TYPES: DocumentType[] = ['convocation', 'convention', 'attestation'];

const sessionInclude = {
  formation: { select: { name: true, description: true, duration: true } },
  trainer: { select: { name: true, firstName: true, lastName: true } },
  participants: {
    where: { enrollmentStatus: 'CONFIRMED' as const },
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      fundingMode: true,
      user: { select: { name: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;

function participantName(user: { name: string | null; firstName: string | null; lastName: string | null }): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    'Participant'
  );
}

type SkippedEntry = { participantId: string; reason: string };

/** Génère et envoie individuellement (un PDF, un e-mail par participant confirmé) le document de session demandé. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { id } = await context.params;
  const sessionId = id?.trim();
  if (!sessionId) return fail('Session id requis', 400);

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.json().catch(() => null);
    if (raw && typeof raw === 'object') body = raw as Record<string, unknown>;
  } catch {
    /* corps optionnel */
  }

  const documentType = typeof body.documentType === 'string' ? (body.documentType as DocumentType) : null;
  if (!documentType || !DOCUMENT_TYPES.includes(documentType)) {
    return fail('documentType invalide (attendu : convocation, convention ou attestation).', 400);
  }
  const requestedParticipantId =
    typeof body.participantId === 'string' && body.participantId.trim() ? body.participantId.trim() : null;

  const row = await prisma.formationSession.findUnique({ where: { id: sessionId }, include: sessionInclude });
  if (!row) return fail('Session introuvable.', 404);

  const trainerName =
    row.trainer?.name?.trim() ||
    [row.trainer?.firstName, row.trainer?.lastName].filter(Boolean).join(' ').trim() ||
    null;

  let targets = row.participants;
  const skipped: SkippedEntry[] = [];

  if (requestedParticipantId) {
    const match = row.participants.find((p) => p.id === requestedParticipantId);
    if (!match) {
      return ok({
        sent: 0,
        skipped: [{ participantId: requestedParticipantId, reason: 'Participant introuvable ou non confirmé.' }],
      });
    }
    targets = [match];
  }

  if (targets.length === 0) {
    return ok({ sent: 0, skipped: [] });
  }

  const emailChannelReady = isEmailConfigured();
  let sent = 0;

  for (const participant of targets) {
    const name = participantName(participant.user);
    const email = participant.user.email;

    if (!email) {
      skipped.push({ participantId: participant.id, reason: 'Participant sans adresse e-mail.' });
      continue;
    }
    if (!emailChannelReady) {
      skipped.push({
        participantId: participant.id,
        reason: 'Canal e-mail non configuré (RESEND_API_KEY ou SMTP_HOST).',
      });
      continue;
    }

    try {
      if (documentType === 'convocation') {
        const { buffer, filename } = await buildSessionConvocationPdf({
          formationName: row.formation.name,
          sessionLabel: row.dateDisplayLabel,
          startDate: row.startDate,
          location: row.location,
          venueLabel: null,
          trainerName,
          participants: [{ participantId: participant.id, name, email }],
        });
        if (session.user?.id) {
          try {
            await storeSessionConvocationPdfAsset({
              sessionId,
              buffer,
              filename,
              createdById: session.user.id,
              participantCount: 1,
            });
          } catch (archiveError) {
            console.error('[session documents send] archivage convocation', archiveError);
          }
        }
        await sendSessionConvocationEmail({
          to: email,
          participantName: name,
          formationName: row.formation.name,
          sessionLabel: row.dateDisplayLabel,
          location: row.location,
          organizationName: "FORM'SSI",
          pdfBuffer: buffer,
          pdfFilename: filename,
        });
      } else if (documentType === 'convention') {
        const { buffer, filename } = await buildSessionConventionPdf({
          formationName: row.formation.name,
          formationDescription: row.formation.description,
          sessionLabel: row.dateDisplayLabel,
          startDate: row.startDate,
          endDate: row.endDate,
          location: row.location,
          trainerName,
          participants: [
            { participantId: participant.id, name, email, fundingMode: participant.fundingMode },
          ],
        });
        if (session.user?.id) {
          try {
            await storeSessionConventionPdfAsset({
              sessionId,
              buffer,
              filename,
              createdById: session.user.id,
              participantCount: 1,
            });
          } catch (archiveError) {
            console.error('[session documents send] archivage convention', archiveError);
          }
        }
        await sendSessionConventionEmail({
          to: email,
          participantName: name,
          formationName: row.formation.name,
          sessionLabel: row.dateDisplayLabel,
          location: row.location,
          organizationName: "FORM'SSI",
          pdfBuffer: buffer,
          pdfFilename: filename,
        });
      } else {
        const { buffer, filename } = await buildSessionCertificatePdf({
          formationName: row.formation.name,
          formationDuration: row.formation.duration,
          sessionLabel: row.dateDisplayLabel,
          startDate: row.startDate,
          endDate: row.endDate,
          location: row.location,
          trainerName,
          participants: [{ participantId: participant.id, name }],
        });
        if (session.user?.id) {
          try {
            await storeSessionCertificatePdfAsset({
              sessionId,
              buffer,
              filename,
              createdById: session.user.id,
              participantCount: 1,
            });
          } catch (archiveError) {
            console.error('[session documents send] archivage attestation', archiveError);
          }
        }
        await sendSessionAttestationEmail({
          to: email,
          participantName: name,
          formationName: row.formation.name,
          sessionLabel: row.dateDisplayLabel,
          location: row.location,
          organizationName: "FORM'SSI",
          pdfBuffer: buffer,
          pdfFilename: filename,
        });
      }
      sent += 1;
    } catch (e) {
      console.error('[session documents send] génération/envoi', documentType, e);
      skipped.push({ participantId: participant.id, reason: 'Échec de génération ou d’envoi du document.' });
    }
  }

  return ok({ sent, skipped });
}
