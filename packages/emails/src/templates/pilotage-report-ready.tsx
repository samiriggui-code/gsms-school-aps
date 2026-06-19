import React from 'react';
import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type PilotageReportReadyEmailProps = {
  recipientName?: string;
  title: string;
  format: string;
  periodLabel: string;
  sourceLabel?: string;
  ctaUrl: string;
  supportEmail?: string;
};

export function PilotageReportReadyEmail({
  recipientName = 'collaborateur',
  title,
  format,
  periodLabel,
  sourceLabel,
  ctaUrl,
  supportEmail = 'contact-formssi@gmail.com',
}: PilotageReportReadyEmailProps) {
  const meta = sourceLabel ? `${format}, ${periodLabel} — ${sourceLabel}` : `${format}, ${periodLabel}`;

  return (
    <BareboneShell
      preview={`Rapport disponible — ${title}`}
      layout="activation"
      hero={{
        eyebrow: 'Pilotage & rapports',
        title: 'Nouveau rapport disponible',
        description: `Bonjour ${recipientName}, le rapport « ${title} » est prêt (${meta}).`,
        ctaLabel: "Consulter l'historique des rapports",
        ctaUrl,
      }}
    >
      <Text className="font-14 text-fg-3 m-0 text-left font-sans">
        Besoin d&apos;aide ?{' '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default PilotageReportReadyEmail;
