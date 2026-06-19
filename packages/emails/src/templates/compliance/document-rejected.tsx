import React from 'react';
import { Link, Text } from '@react-email/components';

import { BareboneShell } from '../../barebone/barebone-shell';



export type ComplianceDocumentRejectedEmailProps = {

  recipientName: string;

  documentLabel: string;

  dossierLabel: string;

  rejectionReason: string;

  supportEmail: string;

  uploadUrl: string;

};



export function ComplianceDocumentRejectedEmail({

  recipientName = 'Candidat',

  documentLabel = 'Pièce d’identité',

  dossierLabel = 'Dossier admission',

  rejectionReason = 'Document illisible ou non conforme.',

  supportEmail = 'contact-formssi@gmail.com',

  uploadUrl,

}: ComplianceDocumentRejectedEmailProps) {

  return (

    <BareboneShell

      preview={`Pièce à reprendre — ${documentLabel}`}

      layout="activation"

      hero={{

        eyebrow: 'Conformité',

        title: 'Document à reprendre',

        description: `Bonjour ${recipientName}, la pièce « ${documentLabel} » n’a pas pu être validée.`,

        ctaLabel: 'Envoyer une nouvelle version',

        ctaUrl: uploadUrl,

      }}

    >

      <Text className="font-14 text-fg m-0 mb-2 text-left font-sans font-semibold">Motif</Text>

      <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans whitespace-pre-wrap">

        {rejectionReason}

      </Text>

      <Text className="font-16 text-fg-2 m-0 mb-6 text-left font-sans">

        Merci de déposer une nouvelle version pour votre {dossierLabel.toLowerCase()}.

      </Text>

      <Text className="font-14 text-fg-3 m-0 text-left font-sans">

        <Link href={`mailto:${supportEmail}`} className="text-brand">

          {supportEmail}

        </Link>

      </Text>

    </BareboneShell>

  );

}



export default ComplianceDocumentRejectedEmail;

