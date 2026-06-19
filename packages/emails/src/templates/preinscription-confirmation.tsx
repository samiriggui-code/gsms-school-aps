import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';
import { emailSiteUrl } from '../email-assets';

export type PreinscriptionConfirmationEmailProps = {
  firstName: string;
  formationLabel: string;
  sessionNote?: string;
  supportEmail: string;
};

export function PreinscriptionConfirmationEmail({
  firstName = 'Candidat',
  formationLabel = '—',
  sessionNote,
  supportEmail = 'contact-formssi@gmail.com',
}: PreinscriptionConfirmationEmailProps) {
  const site = emailSiteUrl();

  return (
    <BareboneShell
      preview="Préinscription enregistrée"
      layout="text-only"
      textOnlyTitle="Préinscription enregistrée"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {firstName}, votre dossier de préinscription pour{' '}
        <strong>{formationLabel}</strong> a bien été transmis à FORM&apos;SSI.
        {sessionNote ? <> Créneau ou période indiquée : {sessionNote}.</> : null}
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Notre équipe pédagogique examine votre dossier et vous recontactera pour la suite du
        parcours (compléments, validation, inscription en session).
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Contact :{' '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
      <Text className="font-13 text-fg-3 m-0 font-sans">
        <Link href={site} className="text-brand">
          {site}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default PreinscriptionConfirmationEmail;
