import React from 'react';
import { Link, Text } from '@react-email/components';

import { BareboneShell } from '../../barebone/barebone-shell';



export type ComplianceDocumentRequestReminderEmailProps = {

  recipientName: string;

  documentLabel: string;

  dossierLabel: string;

  supportEmail: string;

  uploadUrl: string;

  dueDateLabel?: string;

  daysWaiting?: number;

};



export function ComplianceDocumentRequestReminderEmail({

  recipientName = 'Candidat',

  documentLabel = 'Pièce d’identité',

  dossierLabel = 'Dossier admission',

  supportEmail = 'contact-formssi@gmail.com',

  uploadUrl,

  dueDateLabel,

  daysWaiting = 3,

}: ComplianceDocumentRequestReminderEmailProps) {

  return (

    <BareboneShell

      preview={`Rappel — ${documentLabel}`}

      layout="activation"

      hero={{

        eyebrow: 'Rappel conformité',

        title: 'Pièce toujours attendue',

        description: `Bonjour ${recipientName}, nous n’avons pas encore reçu « ${documentLabel} » pour votre ${dossierLabel.toLowerCase()}.`,

        ctaLabel: 'Déposer maintenant',

        ctaUrl: uploadUrl,

        disclaimer: dueDateLabel ? `Échéance : ${dueDateLabel}` : `Relance après ${daysWaiting} jour(s)`,

      }}

    >

      <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans">

        Sans cette pièce, nous ne pourrons pas poursuivre l’instruction de votre dossier.

      </Text>

      <Text className="font-14 text-fg-3 m-0 text-left font-sans">

        <Link href={`mailto:${supportEmail}`} className="text-brand">

          {supportEmail}

        </Link>

      </Text>

    </BareboneShell>

  );

}



export default ComplianceDocumentRequestReminderEmail;

