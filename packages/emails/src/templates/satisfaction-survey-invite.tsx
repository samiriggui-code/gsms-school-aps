import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type SatisfactionInviteEmailTiming = 'hot' | 'cold' | 'company' | 'trainer' | 'funder';

export type SatisfactionSurveyInviteEmailProps = {
  recipientName: string;
  formationName: string;
  sessionLabel: string;
  surveyUrl: string;
  timing: SatisfactionInviteEmailTiming;
  supportEmail?: string;
};

function copyForTiming(
  timing: SatisfactionInviteEmailTiming,
  recipientName: string,
  formationName: string,
  sessionLabel: string,
): { title: string; description: string } {
  switch (timing) {
    case 'cold':
      return {
        title: 'Votre retour à froid sur la formation',
        description: `Bonjour ${recipientName}, quelques semaines après « ${formationName} » (${sessionLabel}), nous aimerions savoir si la formation vous a été utile sur le terrain.`,
      };
    case 'company':
      return {
        title: 'Votre retour entreprise',
        description: `Bonjour ${recipientName}, suite à la session « ${formationName} » (${sessionLabel}), nous recueillons le retour de l’employeur / commanditaire.`,
      };
    case 'trainer':
      return {
        title: 'Votre retour formateur',
        description: `Bonjour ${recipientName}, merci de partager votre retour sur la session « ${formationName} » (${sessionLabel}).`,
      };
    case 'funder':
      return {
        title: 'Votre retour financeur',
        description: `Bonjour ${recipientName}, dans le cadre du dossier « ${formationName} » (${sessionLabel}), nous vous invitons à un retour financeur.`,
      };
    case 'hot':
      return {
        title: 'Votre avis sur la formation',
        description: `Bonjour ${recipientName}, merci d'avoir suivi « ${formationName} » (${sessionLabel}). Votre avis nous aide à améliorer nos formations.`,
      };
    default: {
      const _exhaustive: never = timing;
      return _exhaustive;
    }
  }
}

export function SatisfactionSurveyInviteEmail({
  recipientName = 'Stagiaire',
  formationName,
  sessionLabel,
  surveyUrl,
  timing,
  supportEmail = 'contact-formssi@gmail.com',
}: SatisfactionSurveyInviteEmailProps) {
  const { title, description } = copyForTiming(timing, recipientName, formationName, sessionLabel);

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
