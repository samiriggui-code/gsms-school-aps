import type { PrismaClient } from '@repo/database';
import {
  isEmailConfigured,
  getSupportEmail,
  sendSignatureMissingEmail,
  sendAbsenceJustificationRequestEmail,
  slotLabelFr,
} from '@repo/mail';
import { fetchPedagogyDailyAlerts } from '@repo/api-core';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

function displayName(user: {
  name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email?.trim() ||
    'Contact'
  );
}

/**
 * WF-17 + WF-18 — après clôture de journée : notifier signatures manquantes
 * (sans créer d’émargement) et demander justification des absences UNJUSTIFIED.
 */
export async function processPedagogyEveningWorkflows(
  prisma: PrismaClient,
  ref = new Date(),
): Promise<{
  signatureNotices: number;
  justificationRequests: number;
  skipped: string[];
}> {
  const alerts = await fetchPedagogyDailyAlerts(prisma, ref);
  let signatureNotices = 0;
  let justificationRequests = 0;
  const skipped: string[] = [];
  const adminEmail = getSupportEmail();
  const mailOk = isEmailConfigured();

  for (const session of alerts.sessions) {
    const trainerEmail = session.trainer?.email?.trim() || null;
    const trainerName = session.trainer
      ? displayName(session.trainer)
      : 'Formateur';

    for (const gap of session.unsigned) {
      if (!mailOk) {
        skipped.push('email non configuré');
        break;
      }
      const slot = slotLabelFr(gap.slot);
      if (gap.email) {
        await sendSignatureMissingEmail({
          to: gap.email,
          recipientName: gap.name,
          roleLabel: 'apprenant',
          formationName: session.formationName,
          sessionLabel: session.sessionLabel,
          dayDate: session.dayDate,
          slotLabel: slot,
        });
        signatureNotices += 1;
      }
      if (trainerEmail) {
        await sendSignatureMissingEmail({
          to: trainerEmail,
          recipientName: trainerName,
          roleLabel: 'formateur',
          formationName: session.formationName,
          sessionLabel: session.sessionLabel,
          dayDate: session.dayDate,
          slotLabel: slot,
          learnerName: gap.name,
        });
        signatureNotices += 1;
      }
      if (adminEmail) {
        await sendSignatureMissingEmail({
          to: adminEmail,
          recipientName: 'Administration',
          roleLabel: 'administration',
          formationName: session.formationName,
          sessionLabel: session.sessionLabel,
          dayDate: session.dayDate,
          slotLabel: slot,
          learnerName: gap.name,
        });
        signatureNotices += 1;
      }
    }

    for (const abs of session.absences) {
      if (abs.justificationStatus === 'JUSTIFICATION_REQUESTED') continue;
      if (!abs.emargementId) continue;

      await prisma.formationSessionEmargement.update({
        where: { id: abs.emargementId },
        data: {
          justificationStatus: 'JUSTIFICATION_REQUESTED',
          justificationRequestedAt: new Date(),
        },
      });

      await recordStatusEvidence(prisma, {
        category: 'session_attendance',
        sourceType: 'RELATION',
        sourceId: abs.emargementId,
        eventName: 'LEARNER_ABSENT',
        fromStatus: abs.justificationStatus ?? 'UNJUSTIFIED',
        toStatus: 'JUSTIFICATION_REQUESTED',
        sessionId: session.sessionId,
        metadata: {
          dayDate: session.dayDate,
          slot: abs.slot,
          participantId: abs.participantId,
        },
      });

      if (mailOk && abs.email) {
        await sendAbsenceJustificationRequestEmail({
          to: abs.email,
          recipientName: abs.name,
          formationName: session.formationName,
          sessionLabel: session.sessionLabel,
          dayDate: session.dayDate,
          slotLabel: slotLabelFr(abs.slot),
          learnerName: abs.name,
        });
        justificationRequests += 1;
      }
      if (mailOk && trainerEmail) {
        await sendAbsenceJustificationRequestEmail({
          to: trainerEmail,
          recipientName: trainerName,
          formationName: session.formationName,
          sessionLabel: session.sessionLabel,
          dayDate: session.dayDate,
          slotLabel: slotLabelFr(abs.slot),
          learnerName: abs.name,
        });
        justificationRequests += 1;
      }
    }
  }

  return { signatureNotices, justificationRequests, skipped: [...new Set(skipped)] };
}
