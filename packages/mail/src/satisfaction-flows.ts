import { SatisfactionSurveyInviteEmail, renderEmail } from '@repo/emails';
import { ensureEmailAssetsOrigin, getSupportEmail, sendEmail } from './send-email';

export type SatisfactionInviteMailTiming = 'hot' | 'cold' | 'company' | 'trainer' | 'funder';

export type SatisfactionSurveyInviteMailContext = {
  recipientName: string;
  recipientEmail: string;
  formationName: string;
  sessionLabel: string;
  surveyUrl: string;
  /** Audience : stagiaire hot/cold ou parties prenantes (WF-28/29/30). */
  timing: SatisfactionInviteMailTiming;
  supportEmail?: string;
};

function subjectForTiming(timing: SatisfactionInviteMailTiming, formationName: string): string {
  switch (timing) {
    case 'cold':
      return `[FORM'SSI] Votre retour à froid — ${formationName}`;
    case 'company':
      return `[FORM'SSI] Retour entreprise — ${formationName}`;
    case 'trainer':
      return `[FORM'SSI] Retour formateur — ${formationName}`;
    case 'funder':
      return `[FORM'SSI] Retour financeur — ${formationName}`;
    case 'hot':
      return `[FORM'SSI] Votre avis sur la formation — ${formationName}`;
    default: {
      const _exhaustive: never = timing;
      return _exhaustive;
    }
  }
}

export async function sendSatisfactionSurveyInviteEmail(
  input: SatisfactionSurveyInviteMailContext,
  options?: { assetsOrigin?: string },
): Promise<void> {
  ensureEmailAssetsOrigin(options?.assetsOrigin);
  const supportEmail = input.supportEmail ?? getSupportEmail();
  const html = await renderEmail(
    SatisfactionSurveyInviteEmail({
      recipientName: input.recipientName,
      formationName: input.formationName,
      sessionLabel: input.sessionLabel,
      surveyUrl: input.surveyUrl,
      timing: input.timing,
      supportEmail,
    }),
  );
  await sendEmail({
    to: input.recipientEmail,
    subject: subjectForTiming(input.timing, input.formationName),
    html,
    text: `Bonjour ${input.recipientName}, merci de répondre à notre enquête de satisfaction : ${input.surveyUrl}`,
  });
}
