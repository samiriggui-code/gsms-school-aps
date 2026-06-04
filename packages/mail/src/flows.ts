import {
  ContactConfirmationEmail,
  ContactNotificationEmail,
  PreinscriptionConfirmationEmail,
  PreinscriptionNotificationEmail,
  QuoteRequestConfirmationEmail,
  QuoteRequestNotificationEmail,
  renderEmail,
} from '@repo/emails';
import { ensureEmailAssetsOrigin, getContactRecipient, getSupportEmail, sendEmail } from './send-email';

export type ContactFormPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type SendContactEmailsResult = {
  notification: { sent: boolean; error?: string };
  confirmation: { sent: boolean; error?: string };
};

export async function sendContactFormEmails(
  input: ContactFormPayload,
  options?: { assetsOrigin?: string; sendUserConfirmation?: boolean },
): Promise<SendContactEmailsResult> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);

  const adminTo = getContactRecipient();
  const supportEmail = getSupportEmail();
  const result: SendContactEmailsResult = {
    notification: { sent: false },
    confirmation: { sent: false },
  };

  const notificationHtml = await renderEmail(
    ContactNotificationEmail({
      senderName: input.name,
      senderEmail: input.email,
      subject: input.subject,
      message: input.message,
    }),
  );

  await sendEmail({
    to: adminTo,
    replyTo: input.email,
    subject: `[Site FORM'SSI] ${input.subject}`,
    html: notificationHtml,
    text: [
      'Nouveau message — formulaire contact',
      '',
      `Nom : ${input.name}`,
      `E-mail : ${input.email}`,
      `Sujet : ${input.subject}`,
      '',
      input.message,
    ].join('\n'),
  });
  result.notification.sent = true;

  const sendUserCopy = options?.sendUserConfirmation !== false
    && process.env.CONTACT_SEND_USER_CONFIRMATION?.trim() !== 'false';

  if (!sendUserCopy) return result;

  try {
    const confirmationHtml = await renderEmail(
      ContactConfirmationEmail({
        userName: input.name,
        subject: input.subject,
        supportEmail,
      }),
    );

    await sendEmail({
      to: input.email,
      subject: "Nous avons bien reçu votre message — FORM'SSI",
      html: confirmationHtml,
      text: [
        `Bonjour ${input.name},`,
        '',
        `Nous avons bien reçu votre message concernant « ${input.subject} ».`,
        'Notre équipe vous répondra dès que possible.',
        '',
        `Support : ${supportEmail}`,
      ].join('\n'),
    });
    result.confirmation.sent = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[contact] confirmation non envoyée:', message);
    result.confirmation.error = message;
  }

  return result;
}

export type QuoteRequestEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  formationLabel: string;
  traineesExpected: string;
  preferredDates: string;
  details: string;
};

export type SendQuoteRequestEmailsResult = {
  notification: { sent: boolean; error?: string };
  confirmation: { sent: boolean; error?: string };
};

export async function sendQuoteRequestEmails(
  input: QuoteRequestEmailPayload,
  options?: { assetsOrigin?: string },
): Promise<SendQuoteRequestEmailsResult> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);

  const adminTo = getContactRecipient();
  const supportEmail = getSupportEmail();
  const result: SendQuoteRequestEmailsResult = {
    notification: { sent: false },
    confirmation: { sent: false },
  };

  const notificationHtml = await renderEmail(
    QuoteRequestNotificationEmail({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      company: input.company,
      formationLabel: input.formationLabel,
      traineesExpected: input.traineesExpected,
      preferredDates: input.preferredDates,
      details: input.details,
    }),
  );

  await sendEmail({
    to: adminTo,
    replyTo: input.email,
    subject: `[Devis FORM'SSI] ${input.formationLabel} — ${input.company}`,
    html: notificationHtml,
    text: input.details,
  });
  result.notification.sent = true;

  try {
    const confirmationHtml = await renderEmail(
      QuoteRequestConfirmationEmail({
        firstName: input.firstName,
        formationLabel: input.formationLabel,
        supportEmail,
      }),
    );

    await sendEmail({
      to: input.email,
      subject: "Demande de devis enregistrée — FORM'SSI",
      html: confirmationHtml,
      text: [
        `Bonjour ${input.firstName},`,
        '',
        `Votre demande de devis pour ${input.formationLabel} a bien été enregistrée.`,
        '',
        `Contact : ${supportEmail}`,
      ].join('\n'),
    });
    result.confirmation.sent = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[quote-request] confirmation non envoyée:', message);
    result.confirmation.error = message;
  }

  return result;
}

export type PreinscriptionEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  formationLabel: string;
  sessionNote: string;
  fundingMode: string;
  details: string;
};

export type SendPreinscriptionEmailsResult = {
  notification: { sent: boolean; error?: string };
  confirmation: { sent: boolean; error?: string };
};

export async function sendPreinscriptionEmails(
  input: PreinscriptionEmailPayload,
  options?: { assetsOrigin?: string },
): Promise<SendPreinscriptionEmailsResult> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);

  const adminTo = getContactRecipient();
  const supportEmail = getSupportEmail();
  const result: SendPreinscriptionEmailsResult = {
    notification: { sent: false },
    confirmation: { sent: false },
  };

  const notificationHtml = await renderEmail(
    PreinscriptionNotificationEmail({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      formationLabel: input.formationLabel,
      sessionNote: input.sessionNote,
      fundingMode: input.fundingMode,
      details: input.details,
    }),
  );

  await sendEmail({
    to: adminTo,
    replyTo: input.email,
    subject: `[Préinscription FORM'SSI] ${input.formationLabel} — ${input.firstName} ${input.lastName}`,
    html: notificationHtml,
    text: input.details,
  });
  result.notification.sent = true;

  try {
    const confirmationHtml = await renderEmail(
      PreinscriptionConfirmationEmail({
        firstName: input.firstName,
        formationLabel: input.formationLabel,
        sessionNote: input.sessionNote || undefined,
        supportEmail,
      }),
    );

    await sendEmail({
      to: input.email,
      subject: "Préinscription enregistrée — FORM'SSI",
      html: confirmationHtml,
      text: [
        `Bonjour ${input.firstName},`,
        '',
        `Votre préinscription pour ${input.formationLabel} a bien été transmise.`,
        '',
        `Contact : ${supportEmail}`,
      ].join('\n'),
    });
    result.confirmation.sent = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[preinscription] confirmation non envoyée:', message);
    result.confirmation.error = message;
  }

  return result;
}
