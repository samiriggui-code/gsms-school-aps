import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';
import { emailSiteUrl } from '../email-assets';

export type QuoteRequestConfirmationEmailProps = {
  firstName: string;
  formationLabel: string;
  supportEmail: string;
};

export function QuoteRequestConfirmationEmail({
  firstName = 'Client',
  formationLabel = '—',
  supportEmail = 'contact-formssi@gmail.com',
}: QuoteRequestConfirmationEmailProps) {
  const site = emailSiteUrl();

  return (
    <BareboneShell
      preview="Demande de devis enregistrée"
      layout="text-only"
      textOnlyTitle="Demande bien reçue"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {firstName}, nous avons bien enregistré votre demande de devis pour la formation{' '}
        <strong>{formationLabel}</strong>. Un conseiller FORM&apos;SSI vous recontactera avec une
        proposition adaptée à votre projet.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Questions :{' '}
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

export default QuoteRequestConfirmationEmail;
