import { FinanceFactureSendEmail, renderEmail } from '@repo/emails';
import { sendEmail } from './send-email';

export type FinanceFactureEmailInput = {
  to: string;
  recipientName: string;
  referenceCode: string;
  title: string;
  totalTtc: string;
  message?: string | null;
  pdfBuffer: Buffer;
  pdfFilename: string;
};

/** Envoie la facture au client, PDF joint — pas de plaquette (aucun portail client pour les factures). */
export async function sendFinanceFactureEmail(input: FinanceFactureEmailInput): Promise<void> {
  const subject = `Votre facture ${input.referenceCode}`;
  const html = await renderEmail(
    FinanceFactureSendEmail({
      recipientName: input.recipientName,
      referenceCode: input.referenceCode,
      title: input.title,
      totalTtc: input.totalTtc,
      message: input.message?.trim() || null,
    }),
  );

  await sendEmail({
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
