import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type ContactNotificationEmailProps = {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
};

export function ContactNotificationEmail({
  senderName = 'Visiteur',
  senderEmail = '—',
  subject = '—',
  message = '—',
}: ContactNotificationEmailProps) {
  return (
    <BareboneShell preview={`Contact : ${subject}`} layout="text-only" textOnlyTitle="Nouveau message — site">
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        <strong>Nom :</strong> {senderName}
        <br />
        <strong>E-mail :</strong>{' '}
        <Link href={`mailto:${senderEmail}`} className="text-brand">
          {senderEmail}
        </Link>
        <br />
        <strong>Sujet :</strong> {subject}
      </Text>
      <Text className="font-14 text-fg m-0 mb-2 font-sans font-semibold">Message</Text>
      <Text className="font-16 text-fg-2 m-0 whitespace-pre-wrap font-sans">{message}</Text>
    </BareboneShell>
  );
}

export default ContactNotificationEmail;
