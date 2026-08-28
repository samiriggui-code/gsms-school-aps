import { SatisfactionSurveyInviteEmail, renderEmail } from '@repo/emails';
import { ensureEmailAssetsOrigin, getSupportEmail, sendEmail } from './send-email';

export type SatisfactionSurveyInviteMailContext = {
  recipientName: string;
  recipientEmail: string;
  formationName: string;
  sessionLabel: string;
  surveyUrl: string;
  /** `hot` (à chaud, fin de session) ou `cold` (à froid, J+45). */
  timing: 'hot' | 'cold';
  supportEmail?: string;
};

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
  const subject =
    input.timing === 'cold'
      ? `[FORM'SSI] Votre retour à froid — ${input.formationName}`
      : `[FORM'SSI] Votre avis sur la formation — ${input.formationName}`;
  await sendEmail({
    to: input.recipientEmail,
    subject,
    html,
    text: `Bonjour ${input.recipientName}, merci de répondre à notre enquête de satisfaction : ${input.surveyUrl}`,
  });
}
