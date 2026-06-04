import { Link, Text } from '@react-email/components';
import { BareboneShell } from '../barebone/barebone-shell';

export type PreinscriptionNotificationEmailProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  formationLabel: string;
  sessionNote: string;
  fundingMode: string;
  details: string;
};

export function PreinscriptionNotificationEmail({
  firstName,
  lastName,
  email,
  phone,
  formationLabel,
  sessionNote,
  fundingMode,
  details,
}: PreinscriptionNotificationEmailProps) {
  return (
    <BareboneShell
      preview={`Préinscription — ${formationLabel}`}
      layout="text-only"
      textOnlyTitle="Nouvelle préinscription landing"
    >
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        <strong>Candidat :</strong> {firstName} {lastName}
        <br />
        <strong>E-mail :</strong>{' '}
        <Link href={`mailto:${email}`} className="text-brand">
          {email}
        </Link>
        <br />
        <strong>Téléphone :</strong> {phone}
        <br />
        <strong>Formation :</strong> {formationLabel}
        <br />
        {sessionNote ? (
          <>
            <strong>Session / période :</strong> {sessionNote}
            <br />
          </>
        ) : null}
        <strong>Financement :</strong> {fundingMode}
      </Text>
      <Text className="font-14 text-fg m-0 mb-2 font-sans font-semibold">Dossier</Text>
      <Text className="font-16 text-fg-2 m-0 whitespace-pre-wrap font-sans">{details}</Text>
    </BareboneShell>
  );
}

export default PreinscriptionNotificationEmail;
