import { sendEmail, getSupportEmail, isEmailConfigured } from './send-email';

export type SignatureMissingMailInput = {
  to: string;
  recipientName: string;
  roleLabel: 'apprenant' | 'formateur' | 'administration';
  formationName: string;
  sessionLabel: string;
  dayDate: string;
  slotLabel: string;
  learnerName?: string;
};

const SLOT_FR: Record<string, string> = {
  MORNING: 'matin',
  EVENING: 'après-midi',
};

export function slotLabelFr(slot: string): string {
  return SLOT_FR[slot] ?? slot;
}

/** WF-17 — alerte signature manquante (ne crée jamais d’émargement). */
export async function sendSignatureMissingEmail(input: SignatureMissingMailInput): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] Signature manquante — ${input.formationName}`;
  const about =
    input.roleLabel === 'apprenant'
      ? `Votre émargement ${input.slotLabel} du ${input.dayDate} n’a pas été enregistré pour la session « ${input.sessionLabel} ».`
      : `Émargement manquant (${input.slotLabel}, ${input.dayDate}) — ${input.learnerName ?? 'stagiaire'} — session « ${input.sessionLabel} ».`;
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.recipientName},</p><p>${about}</p><p>Merci de régulariser l’émargement dans le CRM. Aucune signature n’est créée automatiquement.</p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Bonjour ${input.recipientName}, ${about}`,
  });
}

export type AbsenceJustificationMailInput = {
  to: string;
  recipientName: string;
  formationName: string;
  sessionLabel: string;
  dayDate: string;
  slotLabel: string;
  learnerName: string;
};

/** WF-18 — demande de justification d’absence. */
export async function sendAbsenceJustificationRequestEmail(
  input: AbsenceJustificationMailInput,
): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] Justification d’absence — ${input.formationName}`;
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.recipientName},</p><p>Une absence a été enregistrée pour ${input.learnerName} (${input.slotLabel}, ${input.dayDate}) sur « ${input.sessionLabel} ».</p><p>Merci de transmettre une justification (arrêt, motif, etc.) à l’organisme.</p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Absence ${input.learnerName} — ${input.dayDate} ${input.slotLabel} — ${input.sessionLabel}`,
  });
}

export type ConventionReminderMailInput = {
  to: string;
  participantName: string;
  formationName: string;
  sessionLabel: string;
  reminderDay: 2 | 5;
};

/** WF-08 — relance convention non signée (J+2 / J+5). */
export async function sendConventionReminderEmail(input: ConventionReminderMailInput): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] Relance convention (J+${input.reminderDay}) — ${input.formationName}`;
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.participantName},</p><p>Nous n’avons pas encore enregistré la signature de votre convention pour « ${input.formationName} » (${input.sessionLabel}).</p><p>Merci de nous retourner le document signé dès que possible.</p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Relance convention J+${input.reminderDay} — ${input.formationName}`,
  });
}
