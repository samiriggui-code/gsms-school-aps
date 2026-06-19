import React from 'react';
import { Link, Text } from '@react-email/components';

import { BareboneShell } from '../../barebone/barebone-shell';



export type ComplianceDocumentExpiringEmailProps = {

  recipientName: string;

  documentLabel: string;

  dossierLabel: string;

  expiryDateLabel: string;

  supportEmail: string;

  uploadUrl: string;

};



export function ComplianceDocumentExpiringEmail({

  recipientName = 'Candidat',

  documentLabel = 'Carte professionnelle',

  dossierLabel = 'Dossier admission',

  expiryDateLabel = '—',

  supportEmail = 'contact-formssi@gmail.com',

  uploadUrl,

}: ComplianceDocumentExpiringEmailProps) {

  return (

    <BareboneShell

      preview={`Échéance proche — ${documentLabel}`}

      layout="activation"

      hero={{

        eyebrow: 'Alerte conformité',

        title: 'Document bientôt expiré',

        description: `Bonjour ${recipientName}, « ${documentLabel} » arrive à échéance le ${expiryDateLabel}.`,

        ctaLabel: 'Mettre à jour le document',

        ctaUrl: uploadUrl,

      }}

    >

      <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans">

        Pour garder votre {dossierLabel.toLowerCase()} à jour, merci de fournir une version en cours

        de validité.

      </Text>

      <Text className="font-14 text-fg-3 m-0 text-left font-sans">

        <Link href={`mailto:${supportEmail}`} className="text-brand">

          {supportEmail}

        </Link>

      </Text>

    </BareboneShell>

  );

}



export default ComplianceDocumentExpiringEmail;

