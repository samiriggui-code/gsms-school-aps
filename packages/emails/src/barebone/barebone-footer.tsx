import { Column, Link, Row, Section, Text } from '@react-email/components';
import { FORMSSI_EMAIL_BRAND } from '../brand';
import { emailSiteUrl } from '../email-assets';

export function BareboneFooter() {
  const { footer } = FORMSSI_EMAIL_BRAND;
  const site = emailSiteUrl();

  return (
    <Section className="bg-bg border-stroke-strong border-t border-solid">
      <Row>
        <Column className="px-6 py-10 text-center">
          <Text className="font-13 text-fg-3 mx-auto mt-0 mb-6 max-w-[320px] text-center font-sans">
            {footer.tagline}
          </Text>
          <Text className="font-11 text-fg-3 mt-4 mb-5 text-center font-sans">
            {footer.addressLine1}
            <br />
            <Link href={site} className="text-brand no-underline">
              {footer.addressLine2.split(' · ')[0]}
            </Link>
            {' · '}
            <Link href={`mailto:${FORMSSI_EMAIL_BRAND.supportEmail}`} className="text-brand no-underline">
              {FORMSSI_EMAIL_BRAND.supportEmail}
            </Link>
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
