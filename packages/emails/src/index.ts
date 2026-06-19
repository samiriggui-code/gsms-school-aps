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
export {
  ComplianceDocumentRequestEmail,
  type ComplianceEmailBaseProps,
} from './templates/compliance/document-request';
export {
  ComplianceDocumentRequestReminderEmail,
  type ComplianceDocumentRequestReminderEmailProps,
} from './templates/compliance/document-request-reminder';
export {
  ComplianceDocumentReceivedEmail,
  type ComplianceDocumentReceivedEmailProps,
} from './templates/compliance/document-received';
export {
  ComplianceDocumentValidatedEmail,
  type ComplianceDocumentValidatedEmailProps,
} from './templates/compliance/document-validated';
export {
  ComplianceDocumentRejectedEmail,
  type ComplianceDocumentRejectedEmailProps,
} from './templates/compliance/document-rejected';
export {
  ComplianceDocumentExpiringEmail,
  type ComplianceDocumentExpiringEmailProps,
} from './templates/compliance/document-expiring';
export {
  ComplianceDossierCompleteEmail,
  type ComplianceDossierCompleteEmailProps,
} from './templates/compliance/dossier-complete';
export {
  ComplianceDossierIncompleteAdminEmail,
  type ComplianceDossierIncompleteAdminEmailProps,
} from './templates/compliance/dossier-incomplete-admin';
export {
  emailLogoUrl,
  emailIconUrl,
  emailSiteUrl,
  getEmailAssetsOrigin,
  resolveEmailAssetsOrigin,
} from './email-assets';
export { BareboneShell, EMAIL_BUTTON_CLASS } from './barebone/barebone-shell';
export { barebonesBoxedTailwindConfig } from './barebone/theme';
export { EmailLayout } from './components/email-layout';
export {
  OpsResourceAlertEmail,
  type OpsResourceAlertEmailProps,
} from './templates/ops-resource-alert';
export {
  PilotageReportReadyEmail,
  type PilotageReportReadyEmailProps,
} from './templates/pilotage-report-ready';
export {
  EMAIL_TEMPLATE_CATALOG,
  CRM_EVENT_EMAIL_TEMPLATE,
  getEmailTemplateCatalogEntry,
  type EmailTemplateCatalogEntry,
  type EmailTemplateDomain,
} from './email-template-catalog';
export { EMAIL_TEMPLATE_IDS, type EmailTemplateId } from './email-template-ids';
