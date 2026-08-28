import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type SatisfactionSurveyInviteEmailProps = {
  recipientName: string;
  formationName: string;
  sessionLabel: string;
  surveyUrl: string;
  /** `hot` (à chaud, fin de session) ou `cold` (à froid, J+45). */
  timing: 'hot' | 'cold';
  supportEmail?: string;
};

export function SatisfactionSurveyInviteEmail({
  recipientName = 'Stagiaire',
  formationName,
  sessionLabel,
  surveyUrl,
  timing,
  supportEmail = 'contact-formssi@gmail.com',
}: SatisfactionSurveyInviteEmailProps) {
  const isCold = timing === 'cold';
  const title = isCold ? 'Votre retour à froid sur la formation' : 'Votre avis sur la formation';
  const description = isCold
    ? `Bonjour ${recipientName}, quelques semaines après « ${formationName} » (${sessionLabel}), nous aimerions savoir si la formation vous a été utile sur le terrain.`
    : `Bonjour ${recipientName}, merci d'avoir suivi « ${formationName} » (${sessionLabel}). Votre avis nous aide à améliorer nos formations.`;

  return (
    <BareboneShell
      preview={title}
      layout="activation"
      hero={{
        eyebrow: 'Enquête de satisfaction',
        title,
        description,
        ctaLabel: 'Répondre au questionnaire',
        ctaUrl: surveyUrl,
        disclaimer: 'Quelques minutes suffisent — vos réponses restent confidentielles.',
      }}
    >
      <Text className="font-14 text-fg-3 m-0 text-left font-sans">
        Besoin d&apos;aide ?{' '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default SatisfactionSurveyInviteEmail;
