export { FORMSSI_EMAIL_BRAND } from './brand';
export { renderEmail } from './render-email';
export {
  ContactNotificationEmail,
  type ContactNotificationEmailProps,
} from './templates/contact-notification';
export {
  ContactConfirmationEmail,
  type ContactConfirmationEmailProps,
} from './templates/contact-confirmation';
export {
  QuoteRequestNotificationEmail,
  type QuoteRequestNotificationEmailProps,
} from './templates/quote-request-notification';
export {
  QuoteRequestConfirmationEmail,
  type QuoteRequestConfirmationEmailProps,
} from './templates/quote-request-confirmation';
export {
  PreinscriptionNotificationEmail,
  type PreinscriptionNotificationEmailProps,
} from './templates/preinscription-notification';
export {
  PreinscriptionConfirmationEmail,
  type PreinscriptionConfirmationEmailProps,
} from './templates/preinscription-confirmation';
export { DevisQuoteEmail, type DevisQuoteEmailProps, type DevisQuoteLineRow } from './templates/devis-quote';
export { emailLogoUrl, emailSiteUrl, getEmailAssetsOrigin } from './email-assets';
export { BareboneShell, EMAIL_BUTTON_CLASS } from './barebone/barebone-shell';
export { barebonesBoxedTailwindConfig } from './barebone/theme';
export { EmailLayout } from './components/email-layout';

export const EMAIL_TEMPLATE_IDS = [
  'contact-notification',
  'contact-confirmation',
  'quote-request-notification',
  'quote-request-confirmation',
  'preinscription-notification',
  'preinscription-confirmation',
  'devis-quote',
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];
