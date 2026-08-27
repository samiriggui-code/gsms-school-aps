import { sendEmail } from './send-email';

export type SessionConvocationEmailInput = {
  to: string;
  participantName: string;
  formationName: string;
  sessionLabel: string;
  location: string;
  organizationName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
};

/**
 * Envoie la convocation de session au participant, PDF joint. Premier « circuit qui envoie
 * réellement » (GSMS-OF-03) — gabarit HTML simple pour l'instant, à faire évoluer vers un
 * template @repo/emails si l'usage se généralise.
 */
export async function sendSessionConvocationEmail(input: SessionConvocationEmailInput): Promise<void> {
  const subject = `Convocation — ${input.formationName} (${input.sessionLabel})`;
  const text =
    `Bonjour ${input.participantName},\n\n` +
    `Vous trouverez ci-joint votre convocation à la formation « ${input.formationName} », ` +
    `session ${input.sessionLabel}, à ${input.location}.\n\n` +
    `Cordialement,\n${input.organizationName}`;
  const html =
    `<p>Bonjour ${input.participantName},</p>` +
    `<p>Vous trouverez ci-joint votre convocation à la formation <strong>${input.formationName}</strong>, ` +
    `session ${input.sessionLabel}, à ${input.location}.</p>` +
    `<p>Cordialement,<br/>${input.organizationName}</p>`;

  await sendEmail({
    to: input.to,
    subject,
    text,
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
