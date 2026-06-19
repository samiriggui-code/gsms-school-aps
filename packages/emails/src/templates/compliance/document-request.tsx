import React from 'react';
import { Link, Text } from '@react-email/components';

import { BareboneShell } from '../../barebone/barebone-shell';



export type ComplianceEmailBaseProps = {

  recipientName: string;

  documentLabel: string;

  dossierLabel: string;

  supportEmail: string;

  uploadUrl: string;

  dueDateLabel?: string;

  customMessage?: string;

};



export function ComplianceDocumentRequestEmail({

  recipientName = 'Candidat',

  documentLabel = 'Pièce d’identité',

  dossierLabel = 'Dossier admission',

  supportEmail = 'contact-formssi@gmail.com',

  uploadUrl,

  dueDateLabel,

  customMessage,

}: ComplianceEmailBaseProps) {

  return (

    <BareboneShell

      preview={`Pièce à fournir : ${documentLabel}`}

      layout="activation"

      hero={{

        eyebrow: 'Conformité documentaire',

        title: 'Pièce attendue pour votre dossier',

        description: `Bonjour ${recipientName}, nous avons besoin de « ${documentLabel} » pour compléter votre ${dossierLabel.toLowerCase()}.`,

        ctaLabel: 'Déposer la pièce',

        ctaUrl: uploadUrl,

        disclaimer: dueDateLabel ? `Date limite indicative : ${dueDateLabel}` : undefined,

      }}

    >

      {customMessage ? (

        <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans whitespace-pre-wrap">

          {customMessage}

        </Text>

      ) : null}

      <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans">

        Vous pouvez déposer le document depuis votre espace personnel ou répondre à cet e-mail en

        joignant le fichier.

      </Text>

      <Text className="font-14 text-fg-3 m-0 text-left font-sans">

        Besoin d’aide ?{' '}

        <Link href={`mailto:${supportEmail}`} className="text-brand">

          {supportEmail}

        </Link>

      </Text>

    </BareboneShell>

  );

}



export default ComplianceDocumentRequestEmail;

