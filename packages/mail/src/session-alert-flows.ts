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

export type AdaptationRequiredStaffMailInput = {
  to: string;
  referentName: string;
  learnerName: string;
  learnerEmail: string | null;
  formationName: string;
  detail: string | null;
  candidatureId: string;
};

/** WF-04 — alerte référent handicap organisme (besoin déclaré par le candidat). */
export async function sendAdaptationRequiredStaffEmail(
  input: AdaptationRequiredStaffMailInput,
): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] Besoin d’adaptation — ${input.learnerName}`;
  const detail = input.detail
    ? `<p><strong>Précisions candidat :</strong> ${input.detail}</p>`
    : '<p>Aucune précision complémentaire fournie.</p>';
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.referentName},</p><p>${input.learnerName}${input.learnerEmail ? ` (${input.learnerEmail})` : ''} a déclaré un besoin d’aménagement pour « ${input.formationName} ».</p>${detail}<p>Candidature : ${input.candidatureId}</p><p>Merci d’évaluer l’adaptation (WF-04) dans le CRM.</p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Besoin d’adaptation — ${input.learnerName} — ${input.formationName} — candidature ${input.candidatureId}`,
  });
}

export type J5PrepReminderMailInput = {
  to: string;
  learnerName: string;
  formationName: string;
  sessionLabel: string;
  startDateLabel: string;
  positioningUrl?: string | null;
  adaptationPending?: boolean;
};

/** WF-14 — rappel J-5 préparation (horaires, matériel, positionnement si manquant). */
export async function sendJ5PrepReminderEmail(input: J5PrepReminderMailInput): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] J-5 préparation — ${input.formationName}`;
  const positioning = input.positioningUrl
    ? `<p>Votre positionnement n’est pas encore complété : <a href="${input.positioningUrl}">ouvrir le questionnaire</a>.</p>`
    : '';
  const adaptation = input.adaptationPending
    ? `<p>Un besoin d’aménagement est en cours d’instruction — le référent handicap vous recontactera si besoin.</p>`
    : '';
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.learnerName},</p><p>Votre entrée en formation « ${input.formationName} » est prévue le <strong>${input.startDateLabel}</strong> (${input.sessionLabel}).</p><p>Merci de vérifier : horaires, plan d’accès, matériel demandé, et tout besoin spécifique déjà signalé.</p>${positioning}${adaptation}<p>Contact : ${getSupportEmail()}</p>`,
    text: `J-5 préparation — ${input.formationName} — début ${input.startDateLabel}`,
  });
}

export type ExamRetakeProposedMailInput = {
  to: string;
  learnerName: string;
  formationName: string;
  sessionLabel: string;
  retakeDateLabel: string;
  notes?: string | null;
};

/** WF-24 — proposition de rattrapage examen. */
export async function sendExamRetakeProposedEmail(input: ExamRetakeProposedMailInput): Promise<void> {
  if (!isEmailConfigured()) return;
  const subject = `[FORM'SSI] Proposition de rattrapage — ${input.formationName}`;
  const notes = input.notes?.trim()
    ? `<p><strong>Précisions :</strong> ${input.notes.trim()}</p>`
    : '';
  await sendEmail({
    to: input.to,
    subject,
    html: `<p>Bonjour ${input.learnerName},</p><p>Suite à votre résultat d’examen sur « ${input.formationName} » (${input.sessionLabel}), un rattrapage vous est proposé le <strong>${input.retakeDateLabel}</strong>.</p>${notes}<p>Merci de confirmer votre présence auprès de l’organisme.</p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Rattrapage proposé le ${input.retakeDateLabel} — ${input.formationName}`,
  });
}
