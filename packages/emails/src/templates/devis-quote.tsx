import { Button, Column, Row, Section, Text } from '@react-email/components';
import { BareboneShell, EMAIL_BUTTON_CLASS } from '../barebone/barebone-shell';

export type DevisQuoteLineRow = {
  label: string;
  qty: string;
  unit: string;
  vat: string;
  ht: string;
};

export type DevisQuoteEmailProps = {
  firstName: string;
  lastName: string;
  introLines: string[] | null;
  referenceCode: string;
  title: string;
  lines: DevisQuoteLineRow[];
  totalTtc: string;
  plaquetteUrl: string | null;
};

export function DevisQuoteEmail({
  firstName,
  lastName,
  introLines,
  referenceCode,
  title,
  lines,
  totalTtc,
  plaquetteUrl,
}: DevisQuoteEmailProps) {
  return (
    <BareboneShell
      preview={`Votre devis ${referenceCode} — ${title}`}
      layout="text-only"
      textOnlyTitle="Votre proposition commerciale"
    >
      <Text className="font-16 text-fg-2 m-0 mb-4 font-sans">
        Bonjour {firstName} {lastName},
      </Text>
      {introLines?.length
        ? introLines.map((line, i) => (
            <Text key={i} className="font-16 text-fg-2 m-0 mb-3 font-sans">
              {line}
            </Text>
          ))
        : null}
      <Text className="font-16 text-fg-2 m-0 mb-6 font-sans">
        Vous trouverez ci-dessous le détail de notre proposition{' '}
        <strong>{referenceCode}</strong> — {title}.
      </Text>

      {plaquetteUrl ? (
        <Section className="mb-6 text-left">
          <Button href={plaquetteUrl} className={EMAIL_BUTTON_CLASS}>
            Ouvrir la plaquette (présentation et suivi)
          </Button>
          <Text className="font-13 text-fg-3 mt-4 mb-0 font-sans">
            Lien personnel et limité dans le temps — merci de ne pas le transférer.
          </Text>
        </Section>
      ) : null}

      <Text className="font-14 text-fg m-0 mb-3 font-sans font-semibold">Détail des lignes</Text>
      <Section className="border-stroke-strong mb-4 overflow-hidden rounded-lg border border-solid">
        <Row className="bg-bg-2 px-3 py-2">
          <Column className="w-[38%]">
            <Text className="font-11 text-fg-3 m-0 font-sans font-semibold">Libellé</Text>
          </Column>
          <Column className="w-[12%]">
            <Text className="font-11 text-fg-3 m-0 text-right font-sans font-semibold">Qté</Text>
          </Column>
          <Column className="w-[18%]">
            <Text className="font-11 text-fg-3 m-0 text-right font-sans font-semibold">PU HT</Text>
          </Column>
          <Column className="w-[12%]">
            <Text className="font-11 text-fg-3 m-0 text-right font-sans font-semibold">TVA</Text>
          </Column>
          <Column className="w-[20%]">
            <Text className="font-11 text-fg-3 m-0 text-right font-sans font-semibold">HT</Text>
          </Column>
        </Row>
        {lines.length === 0 ? (
          <Row className="px-3 py-3">
            <Column>
              <Text className="font-14 text-fg-3 m-0 font-sans">Aucune ligne</Text>
            </Column>
          </Row>
        ) : (
          lines.map((l, idx) => (
            <Row
              key={`${l.label}-${idx}`}
              className={`border-stroke border-t border-solid px-3 py-2 ${idx % 2 === 0 ? 'bg-bg' : 'bg-bg-2'}`}
            >
              <Column className="w-[38%]">
                <Text className="font-13 text-fg m-0 font-sans">{l.label}</Text>
              </Column>
              <Column className="w-[12%]">
                <Text className="font-13 text-fg-2 m-0 text-right font-sans">{l.qty}</Text>
              </Column>
              <Column className="w-[18%]">
                <Text className="font-13 text-fg-2 m-0 text-right font-sans">{l.unit}</Text>
              </Column>
              <Column className="w-[12%]">
                <Text className="font-13 text-fg-2 m-0 text-right font-sans">{l.vat}</Text>
              </Column>
              <Column className="w-[20%]">
                <Text className="font-13 text-fg-2 m-0 text-right font-sans">{l.ht}</Text>
              </Column>
            </Row>
          ))
        )}
      </Section>

      <Text className="font-16 text-fg m-0 mb-6 font-sans font-semibold">Total TTC : {totalTtc}</Text>
      <Text className="font-13 text-fg-3 m-0 font-sans">
        Pour toute question, répondez directement à cet e-mail.
      </Text>
    </BareboneShell>
  );
}

export default DevisQuoteEmail;
