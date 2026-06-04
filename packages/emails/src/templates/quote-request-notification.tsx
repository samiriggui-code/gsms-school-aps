import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type QuoteRequestNotificationEmailProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  formationLabel: string;
  traineesExpected: string;
  preferredDates: string;
  details: string;
};

export function QuoteRequestNotificationEmail({
  firstName,
  lastName,
  email,
  phone,
  company,
  formationLabel,
  traineesExpected,
  preferredDates,
  details,
}: QuoteRequestNotificationEmailProps) {
  return (
    <BareboneShell
      preview={`Demande de devis — ${formationLabel}`}
      layout="text-only"
      textOnlyTitle="Nouvelle demande de devis"
    >
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        <strong>Contact :</strong> {firstName} {lastName}
        <br />
        <strong>E-mail :</strong>{' '}
        <Link href={`mailto:${email}`} className="text-brand">
          {email}
        </Link>
        <br />
        <strong>Téléphone :</strong> {phone}
        <br />
        <strong>Entreprise :</strong> {company}
        <br />
        <strong>Formation :</strong> {formationLabel}
        <br />
        <strong>Stagiaires :</strong> {traineesExpected}
        <br />
        <strong>Dates souhaitées :</strong> {preferredDates}
      </Text>
      <Text className="font-14 text-fg m-0 mb-2 font-sans font-semibold">Détail complet</Text>
      <Text className="font-16 text-fg-2 m-0 whitespace-pre-wrap font-sans">{details}</Text>
    </BareboneShell>
  );
}

export default QuoteRequestNotificationEmail;
