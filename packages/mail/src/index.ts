import { DevisQuoteEmail, renderEmail, type DevisQuoteEmailProps } from '@repo/emails';
import { ensureEmailAssetsOrigin, sendEmail } from './send-email';

export async function renderDevisQuoteEmailHtml(props: DevisQuoteEmailProps): Promise<string> {
  return renderEmail(DevisQuoteEmail(props));
}

export async function sendDevisQuoteEmail(
  to: string,
  subject: string,
  props: DevisQuoteEmailProps,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const html = await renderDevisQuoteEmailHtml(props);
  await sendEmail({ to, subject, html });
}

export {
  sendEmail,
  SendEmailError,
  isEmailConfigured,
  isResendConfigured,
  isSmtpConfigured,
  getContactRecipient,
  getSupportEmail,
  getSmtpTransportConfig,
  ensureEmailAssetsOrigin,
  type SendEmailProps,
  type SmtpTransportConfig,
} from './send-email';

export {
  sendContactFormEmails,
  sendQuoteRequestEmails,
  sendPreinscriptionEmails,
  type ContactFormPayload,
  type QuoteRequestEmailPayload,
  type PreinscriptionEmailPayload,
} from './flows';

export {
  sendComplianceDocumentRequestEmail,
  sendComplianceDocumentRequestReminderEmail,
  sendComplianceDocumentReceivedEmail,
  sendComplianceDocumentValidatedEmail,
  sendComplianceDocumentRejectedEmail,
  sendComplianceDocumentExpiringEmail,
  sendComplianceDossierCompleteEmail,
  sendComplianceDossierIncompleteAdminEmail,
  type ComplianceMailContext,
  type ComplianceAdminAlertPayload,
} from './compliance-flows';

import {
  sendResourceOpsEmails,
  type ResourceOpsEmailInput,
} from './resource-ops-flows';

export { sendResourceOpsEmails, type ResourceOpsEmailInput };

export {
  sendPilotageReportReadyEmail,
  isPilotageReportEmailEnabled,
  type PilotageReportEmailInput,
} from './report-flows';

export {
  sendSessionConvocationEmail,
  sendSessionConventionEmail,
  sendSessionAttestationEmail,
  type SessionConvocationEmailInput,
  type SessionDocumentEmailInput,
} from './session-flows';

export {
  sendSignatureMissingEmail,
  sendAbsenceJustificationRequestEmail,
  sendConventionReminderEmail,
  slotLabelFr,
  type SignatureMissingMailInput,
  type AbsenceJustificationMailInput,
  type ConventionReminderMailInput,
} from './session-alert-flows';

export {
  sendSatisfactionSurveyInviteEmail,
  type SatisfactionSurveyInviteMailContext,
  type SatisfactionInviteMailTiming,
} from './satisfaction-flows';

export { sendFinanceFactureEmail, type FinanceFactureEmailInput } from './finance-flows';

export type { DevisQuoteEmailProps } from '@repo/emails';
