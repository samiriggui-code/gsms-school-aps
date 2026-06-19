import { PilotageReportReadyEmail, renderEmail } from '@repo/emails';
import { ensureEmailAssetsOrigin, getSupportEmail, isEmailConfigured, sendEmail } from './send-email';

export type PilotageReportEmailInput = {
  to: string;
  recipientName: string;
  title: string;
  format: string;
  periodLabel: string;
  sourceLabel?: string;
  ctaUrl: string;
};

export async function sendPilotageReportReadyEmail(
  input: PilotageReportEmailInput,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);

  const html = await renderEmail(
    PilotageReportReadyEmail({
      recipientName: input.recipientName,
      title: input.title,
      format: input.format,
      periodLabel: input.periodLabel,
      sourceLabel: input.sourceLabel,
      ctaUrl: input.ctaUrl,
      supportEmail: getSupportEmail(),
    }),
  );

  await sendEmail({
    to: input.to,
    subject: `[Pilotage] Rapport disponible — ${input.title}`,
    html,
    text: `Rapport disponible : ${input.title} (${input.format}, ${input.periodLabel}). ${input.ctaUrl}`,
  });
}

export function isPilotageReportEmailEnabled(): boolean {
  return process.env.REPORT_EMAIL_DISABLED !== '1' && isEmailConfigured();
}
