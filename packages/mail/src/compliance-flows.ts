import {
  ComplianceDocumentExpiringEmail,
  ComplianceDocumentReceivedEmail,
  ComplianceDocumentRejectedEmail,
  ComplianceDocumentRequestEmail,
  ComplianceDocumentRequestReminderEmail,
  ComplianceDocumentValidatedEmail,
  ComplianceDossierCompleteEmail,
  ComplianceDossierIncompleteAdminEmail,
  renderEmail,
} from '@repo/emails';
import { ensureEmailAssetsOrigin, getContactRecipient, getSupportEmail, sendEmail } from './send-email';

export type ComplianceMailContext = {
  recipientName: string;
  recipientEmail: string;
  documentLabel: string;
  dossierLabel: string;
  uploadUrl: string;
  portalUrl?: string;
  supportEmail?: string;
  dueDateLabel?: string;
  customMessage?: string;
  rejectionReason?: string;
  expiryDateLabel?: string;
  daysWaiting?: number;
};

function ctx(input: ComplianceMailContext) {
  return {
    recipientName: input.recipientName,
    documentLabel: input.documentLabel,
    dossierLabel: input.dossierLabel,
    uploadUrl: input.uploadUrl,
    supportEmail: input.supportEmail ?? getSupportEmail(),
  };
}

export async function sendComplianceDocumentRequestEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(
    ComplianceDocumentRequestEmail({
      ...c,
      dueDateLabel: input.dueDateLabel,
      customMessage: input.customMessage,
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Pièce attendue — ${input.documentLabel}`,
    html,
    text: `Bonjour ${input.recipientName}, merci de fournir : ${input.documentLabel}. ${input.uploadUrl}`,
  });
}

export async function sendComplianceDocumentRequestReminderEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(
    ComplianceDocumentRequestReminderEmail({
      ...c,
      dueDateLabel: input.dueDateLabel,
      daysWaiting: input.daysWaiting ?? 3,
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: `[Rappel FORM'SSI] ${input.documentLabel} toujours attendu(e)`,
    html,
  });
}

export async function sendComplianceDocumentReceivedEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(ComplianceDocumentReceivedEmail(c));
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Pièce reçue — ${input.documentLabel}`,
    html,
  });
}

export async function sendComplianceDocumentValidatedEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(ComplianceDocumentValidatedEmail(c));
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Pièce validée — ${input.documentLabel}`,
    html,
  });
}

export async function sendComplianceDocumentRejectedEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(
    ComplianceDocumentRejectedEmail({
      ...c,
      rejectionReason: input.rejectionReason ?? 'Document non conforme.',
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Document à reprendre — ${input.documentLabel}`,
    html,
  });
}

export async function sendComplianceDocumentExpiringEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const c = ctx(input);
  const html = await renderEmail(
    ComplianceDocumentExpiringEmail({
      ...c,
      expiryDateLabel: input.expiryDateLabel ?? '—',
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Échéance proche — ${input.documentLabel}`,
    html,
  });
}

export async function sendComplianceDossierCompleteEmail(
  input: ComplianceMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const supportEmail = input.supportEmail ?? getSupportEmail();
  const html = await renderEmail(
    ComplianceDossierCompleteEmail({
      recipientName: input.recipientName,
      dossierLabel: input.dossierLabel,
      supportEmail,
      portalUrl: input.portalUrl ?? input.uploadUrl,
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: `[FORM'SSI] Dossier documentaire complet`,
    html,
  });
}

export type ComplianceAdminAlertPayload = {
  subjectName: string;
  subjectEmail: string;
  dossierLabel: string;
  missingPieces: string;
  crmUrl: string;
  gedUrl: string;
};

export async function sendComplianceDossierIncompleteAdminEmail(
  input: ComplianceAdminAlertPayload,
  options?: { assetsOrigin?: string; to?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const html = await renderEmail(ComplianceDossierIncompleteAdminEmail(input));
  await sendEmail({
    to: options?.to ?? getContactRecipient(),
    subject: `[Conformité] Pièces manquantes — ${input.subjectName}`,
    html,
    replyTo: input.subjectEmail,
  });
}
