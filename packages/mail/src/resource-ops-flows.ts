import {
  CRM_EVENT_EMAIL_TEMPLATE,
  OpsResourceAlertEmail,
  renderEmail,
  type EmailTemplateId,
} from '@repo/emails';
import { ensureEmailAssetsOrigin, getContactRecipient, getSupportEmail, isEmailConfigured, sendEmail } from './send-email';

export type ResourceOpsEmailInput = {
  eventType: string;
  title: string;
  body: string;
  href?: string | null;
  detailLines?: string[];
  recipientEmails: string[];
  recipientName?: string;
  eyebrow?: string;
};

function crmBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3001').replace(/\/$/, '');
}

function absoluteHref(href?: string | null): string {
  if (!href) return `${crmBaseUrl()}/gestion-ressources/equipements`;
  if (href.startsWith('http')) return href;
  return `${crmBaseUrl()}${href.startsWith('/') ? href : `/${href}`}`;
}

/** E-mails ops ressources — désactivables via RESOURCE_OPS_EMAIL_DISABLED=1. */
export async function sendResourceOpsEmails(
  input: ResourceOpsEmailInput,
  options?: { assetsOrigin?: string },
): Promise<{ sent: number; skipped: boolean }> {
  if (process.env.RESOURCE_OPS_EMAIL_DISABLED === '1' || !isEmailConfigured()) {
    return { sent: 0, skipped: true };
  }

  const templateId: EmailTemplateId | undefined =
    CRM_EVENT_EMAIL_TEMPLATE[input.eventType] ?? 'ops-resource-alert';
  if (templateId !== 'ops-resource-alert') {
    return { sent: 0, skipped: true };
  }

  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const link = absoluteHref(input.href);
  const uniqueRecipients = Array.from(
    new Set(input.recipientEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  );
  if (uniqueRecipients.length === 0) {
    const fallback = getContactRecipient();
    if (fallback) uniqueRecipients.push(fallback.toLowerCase());
  }

  const html = await renderEmail(
    OpsResourceAlertEmail({
      recipientName: input.recipientName ?? 'équipe',
      eyebrow: input.eyebrow ?? 'Ressources & équipements',
      title: input.title,
      body: input.body,
      detailLines: input.detailLines,
      ctaUrl: link,
      supportEmail: getSupportEmail(),
    }),
  );

  let sent = 0;
  for (const to of uniqueRecipients) {
    try {
      await sendEmail({
        to,
        subject: `[FORM'SSI Ressources] ${input.title}`,
        html,
        text: `${input.title}\n\n${input.body}\n\n${link}`,
      });
      sent += 1;
    } catch (err) {
      console.error('[ResourceOpsEmail] failed', to, err);
    }
  }

  return { sent, skipped: false };
}
