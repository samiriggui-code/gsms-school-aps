import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../../barebone/barebone-shell';
import { emailSiteUrl } from '../../email-assets';

export type ComplianceDocumentReceivedEmailProps = {
  recipientName: string;
  documentLabel: string;
  dossierLabel: string;
  supportEmail: string;
};

export function ComplianceDocumentReceivedEmail({
  recipientName = 'Candidat',
  documentLabel = 'Pièce d’identité',
  dossierLabel = 'Dossier admission',
  supportEmail = 'contact-formssi@gmail.com',
}: ComplianceDocumentReceivedEmailProps) {
  const site = emailSiteUrl();

  return (
    <BareboneShell
      preview={`Pièce reçue — ${documentLabel}`}
      layout="text-only"
      textOnlyTitle="Pièce bien reçue"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {recipientName}, nous avons bien enregistré votre document « {documentLabel} » pour
        le {dossierLabel.toLowerCase()}.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Notre équipe va le vérifier. Vous serez informé(e) si un complément est nécessaire.
      </Text>
      <Text className="font-14 text-fg-3 m-0 font-sans">
        <Link href={site} className="text-brand">
          {site}
        </Link>
        {' · '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default ComplianceDocumentReceivedEmail;
