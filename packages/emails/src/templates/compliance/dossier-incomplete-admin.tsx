import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../../barebone/barebone-shell';

export type ComplianceDossierIncompleteAdminEmailProps = {
  subjectName: string;
  subjectEmail: string;
  dossierLabel: string;
  missingPieces: string;
  crmUrl: string;
  gedUrl: string;
};

export function ComplianceDossierIncompleteAdminEmail({
  subjectName = '—',
  subjectEmail = '—',
  dossierLabel = 'Dossier admission',
  missingPieces = '—',
  crmUrl,
  gedUrl,
}: ComplianceDossierIncompleteAdminEmailProps) {
  return (
    <BareboneShell
      preview={`Pièces manquantes — ${subjectName}`}
      layout="text-only"
      textOnlyTitle="Alerte conformité — pièces manquantes"
    >
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        <strong>Dossier :</strong> {dossierLabel}
        <br />
        <strong>Personne :</strong> {subjectName}
        <br />
        <strong>E-mail :</strong>{' '}
        <Link href={`mailto:${subjectEmail}`} className="text-brand">
          {subjectEmail}
        </Link>
      </Text>
      <Text className="font-14 text-fg m-0 mb-2 font-sans font-semibold">Pièces manquantes</Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans whitespace-pre-wrap">{missingPieces}</Text>
      <Text className="font-16 text-fg-2 m-0 font-sans">
        <Link href={crmUrl} className="text-brand">
          Ouvrir la fiche CRM
        </Link>
        {' · '}
        <Link href={gedUrl} className="text-brand">
          Dossier GED
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default ComplianceDossierIncompleteAdminEmail;
