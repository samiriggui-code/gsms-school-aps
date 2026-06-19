import React from 'react';
import { Link, Section, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type OpsResourceAlertEmailProps = {
  recipientName?: string;
  eyebrow?: string;
  title: string;
  body: string;
  detailLines?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  supportEmail?: string;
};

export function OpsResourceAlertEmail({
  recipientName = 'équipe',
  eyebrow = 'Ressources & équipements',
  title,
  body,
  detailLines = [],
  ctaLabel = 'Ouvrir dans le CRM',
  ctaUrl,
  supportEmail = 'contact-formssi@gmail.com',
}: OpsResourceAlertEmailProps) {
  const link = ctaUrl || 'https://formssi.online';

  return (
    <BareboneShell
      preview={title}
      layout="activation"
      hero={{
        eyebrow,
        title,
        description: `Bonjour ${recipientName}, ${body}`,
        ctaLabel,
        ctaUrl: link,
      }}
    >
      {detailLines.length > 0 ? (
        <Section className="mb-6 rounded-lg border border-border bg-bg-2 px-4 py-3 text-left">
          {detailLines.map((line) => (
            <Text key={line} className="font-14 text-fg-2 m-0 mb-2 font-sans last:mb-0">
              {line}
            </Text>
          ))}
        </Section>
      ) : null}
      <Text className="font-14 text-fg-3 m-0 text-left font-sans">
        Besoin d&apos;aide ?{' '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default OpsResourceAlertEmail;
