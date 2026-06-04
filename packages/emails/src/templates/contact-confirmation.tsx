import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';
import { emailSiteUrl } from '../email-assets';

export type ContactConfirmationEmailProps = {
  userName: string;
  subject: string;
  supportEmail: string;
};

export function ContactConfirmationEmail({
  userName = 'Client',
  subject = '—',
  supportEmail = 'contact-formssi@gmail.com',
}: ContactConfirmationEmailProps) {
  const site = emailSiteUrl();

  return (
    <BareboneShell
      preview="Nous avons bien reçu votre message"
      layout="text-only"
      textOnlyTitle="Message bien reçu"
    >
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Bonjour {userName}, nous avons bien reçu votre message concernant{' '}
        <strong>{subject}</strong>. Notre équipe vous répondra dès que possible, en général sous un
        jour ouvré.
      </Text>
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Pour toute urgence :{' '}
        <Link href={`mailto:${supportEmail}`} className="text-brand">
          {supportEmail}
        </Link>
      </Text>
      <Text className="font-13 text-fg-3 m-0 font-sans">
        Retour au site :{' '}
        <Link href={site} className="text-brand">
          {site}
        </Link>
      </Text>
    </BareboneShell>
  );
}

export default ContactConfirmationEmail;
