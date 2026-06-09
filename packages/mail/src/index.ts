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

export type { DevisQuoteEmailProps } from '@repo/emails';
