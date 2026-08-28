import { SessionDocumentEmail, renderEmail, type SessionDocumentKind } from '@repo/emails';
import { sendEmail } from './send-email';

export type SessionDocumentEmailInput = {
  to: string;
  participantName: string;
  formationName: string;
  sessionLabel: string;
  location: string;
  organizationName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
};

/** Compat historique — alias du type générique, utilisé par les routes vie scolaire. */
export type SessionConvocationEmailInput = SessionDocumentEmailInput;

const DOCUMENT_SUBJECT_PREFIX: Record<SessionDocumentKind, string> = {
  convocation: 'Convocation',
  convention: 'Convention de formation',
  attestation: 'Attestation de réalisation',
};

async function sendSessionDocumentEmail(
  documentKind: SessionDocumentKind,
  input: SessionDocumentEmailInput,
): Promise<void> {
  const subject = `${DOCUMENT_SUBJECT_PREFIX[documentKind]} — ${input.formationName} (${input.sessionLabel})`;
  const html = await renderEmail(
    SessionDocumentEmail({
      documentKind,
      participantName: input.participantName,
      formationName: input.formationName,
      sessionLabel: input.sessionLabel,
      location: input.location,
      organizationName: input.organizationName,
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

/**
 * Envoie la convocation de session au participant, PDF joint (GSMS-OF-03 puis GSMS-OF-02 pour le
 * gabarit @repo/emails). Conserve le nom historique — utilisé par trigger-circuit/route.ts.
 */
export async function sendSessionConvocationEmail(input: SessionConvocationEmailInput): Promise<void> {
  await sendSessionDocumentEmail('convocation', input);
}

/** Envoie la convention de formation au participant, PDF joint (GSMS-OF-02). */
export async function sendSessionConventionEmail(input: SessionDocumentEmailInput): Promise<void> {
  await sendSessionDocumentEmail('convention', input);
}

/** Envoie l'attestation de réalisation au participant, PDF joint (GSMS-OF-02). */
export async function sendSessionAttestationEmail(input: SessionDocumentEmailInput): Promise<void> {
  await sendSessionDocumentEmail('attestation', input);
}
