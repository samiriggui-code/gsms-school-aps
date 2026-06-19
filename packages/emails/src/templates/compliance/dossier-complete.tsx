import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../../barebone/barebone-shell';

export type ComplianceDossierCompleteEmailProps = {
  recipientName: string;
  dossierLabel: string;
  supportEmail: string;
  portalUrl: string;
};

export function ComplianceDossierCompleteEmail({
  recipientName = 'Candidat',
  dossierLabel = 'Dossier admission',
  supportEmail = 'contact-formssi@gmail.com',
  portalUrl,
}: ComplianceDossierCompleteEmailProps) {
  return (
    <BareboneShell
      preview={`Dossier complet — ${dossierLabel}`}
      layout="text-only"
      textOnlyTitle="Dossier documentaire complet"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {recipientName}, toutes les pièces requises pour votre {dossierLabel.toLowerCase()}{' '}
        sont désormais complètes.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Notre équipe poursuit l’instruction administrative. Vous serez contacté(e) pour la suite du
        parcours.
      </Text>
      <Text className="font-14 text-fg-3 m-0 font-sans">
        <Link href={portalUrl} className="text-brand">
          Consulter mon espace
        </Link>
        {' · '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default ComplianceDossierCompleteEmail;
