import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../../barebone/barebone-shell';
import { emailSiteUrl } from '../../email-assets';

export type ComplianceDocumentValidatedEmailProps = {
  recipientName: string;
  documentLabel: string;
  dossierLabel: string;
  supportEmail: string;
};

export function ComplianceDocumentValidatedEmail({
  recipientName = 'Candidat',
  documentLabel = 'Pièce d’identité',
  dossierLabel = 'Dossier admission',
  supportEmail = 'contact-formssi@gmail.com',
}: ComplianceDocumentValidatedEmailProps) {
  const site = emailSiteUrl();

  return (
    <BareboneShell
      preview={`Pièce validée — ${documentLabel}`}
      layout="text-only"
      textOnlyTitle="Pièce conforme"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {recipientName}, la pièce « {documentLabel} » de votre {dossierLabel.toLowerCase()}{' '}
        a été validée par nos services.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Votre dossier avance. Nous vous préviendrons s’il reste d’autres documents à fournir.
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

export default ComplianceDocumentValidatedEmail;
