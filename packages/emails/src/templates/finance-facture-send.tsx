import React from 'react';
import { Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type FinanceFactureSendEmailProps = {
  recipientName: string;
  referenceCode: string;
  title: string;
  totalTtc: string;
  /** Message d'accompagnement facultatif saisi par l'équipe. */
  message: string | null;
};

export function FinanceFactureSendEmail({
  recipientName,
  referenceCode,
  title,
  totalTtc,
  message,
}: FinanceFactureSendEmailProps) {
  return (
    <BareboneShell
      preview={`Votre facture ${referenceCode} — ${title}`}
      layout="text-only"
      textOnlyTitle="Votre facture"
    >
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">Bonjour {recipientName},</Text>
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        Vous trouverez ci-joint votre facture <strong>{referenceCode}</strong> — {title}.
      </Text>
      {message ? (
        <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">{message}</Text>
      ) : null}
      <Text className="font-16 text-fg m-0 mb-6 font-sans font-semibold">Total TTC : {totalTtc}</Text>
      <Text className="font-13 text-fg-3 m-0 font-sans">
        Pour toute question relative à cette facture, répondez directement à cet e-mail.
      </Text>
    </BareboneShell>
  );
}

export default FinanceFactureSendEmail;
