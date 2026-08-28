import React from 'react';
import { Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type SessionDocumentKind = 'convocation' | 'convention' | 'attestation';

export type SessionDocumentEmailProps = {
  documentKind: SessionDocumentKind;
  participantName: string;
  formationName: string;
  sessionLabel: string;
  location: string;
  organizationName: string;
};

const DOCUMENT_COPY: Record<SessionDocumentKind, { preview: string; title: string; attachmentNoun: string }> = {
  convocation: {
    preview: 'Votre convocation de session',
    title: 'Votre convocation de session',
    attachmentNoun: 'votre convocation',
  },
  convention: {
    preview: 'Votre convention de formation',
    title: 'Votre convention de formation',
    attachmentNoun: 'la convention de formation',
  },
  attestation: {
    preview: 'Votre attestation de réalisation',
    title: 'Votre attestation de réalisation',
    attachmentNoun: 'votre attestation de réalisation',
  },
};

export function SessionDocumentEmail({
  documentKind,
  participantName,
  formationName,
  sessionLabel,
  location,
  organizationName,
}: SessionDocumentEmailProps) {
  const copy = DOCUMENT_COPY[documentKind];

  return (
    <BareboneShell preview={copy.preview} layout="text-only" textOnlyTitle={copy.title}>
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">Bonjour {participantName},</Text>
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        Vous trouverez ci-joint {copy.attachmentNoun} pour la formation{' '}
        <strong>{formationName}</strong>, session {sessionLabel}, à {location}.
      </Text>
      <Text className="font-13 text-fg-3 m-0 font-sans">
        Pour toute question, répondez directement à cet e-mail.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mt-6 font-sans">
        Cordialement,
        <br />
        {organizationName}
      </Text>
    </BareboneShell>
  );
}

export default SessionDocumentEmail;
