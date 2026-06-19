import React from 'react';
import type { ReactNode } from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { FORMSSI_EMAIL_BRAND } from '../brand';
import { emailIconUrl, emailLogoUrl } from '../email-assets';
import { BareboneFooter } from './barebone-footer';
import { BareboneFonts } from './barebone-fonts';
import { barebonesBoxedTailwindConfig } from './theme';

export type BareboneHero = {
  eyebrow?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  disclaimer?: string;
};

export type BareboneLayout = 'activation' | 'text-only' | 'stacked';

export type BareboneShellProps = {
  preview: string;
  children?: ReactNode;
  layout?: BareboneLayout;
  hero?: BareboneHero;
  textOnlyTitle?: string;
};

export function BareboneShell({
  preview,
  children,
  layout = 'activation',
  hero,
  textOnlyTitle,
}: BareboneShellProps) {
  const isStacked = layout === 'stacked';
  const isTextOnly = layout === 'text-only';

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html lang="fr">
        <Head>
          <BareboneFonts />
        </Head>
        <Body className="bg-bg-2 m-0 text-center font-sans">
          <Preview>{preview}</Preview>
          <Container className="mobile:mt-0 mx-auto mt-8 w-full max-w-[640px]">
            <Section className="bg-bg mobile:px-2 px-6 py-4">
              <Section className="mb-3 px-6">
                <Row>
                  <Column className="w-1/2 py-[7px] align-middle">
                    <Row>
                      <Column className="w-[40px] align-middle pr-2">
                        <Img
                          src={emailIconUrl()}
                          alt={FORMSSI_EMAIL_BRAND.productName}
                          width={36}
                          height={36}
                          className="block"
                        />
                      </Column>
                      <Column className="align-middle">
                        <Text className="font-14 text-fg m-0 text-left font-sans font-semibold">
                          {FORMSSI_EMAIL_BRAND.productName}
                        </Text>
                      </Column>
                    </Row>
                  </Column>
                  <Column align="right" className="w-1/2 py-[7px] align-middle">
                    <Text className="font-13 m-0 text-right font-sans">
                      <span className="text-fg-3">Formation sécurité</span>
                    </Text>
                  </Column>
                </Row>
              </Section>

              {isStacked ? (
                <Section className="px-2">{children}</Section>
              ) : (
                <Section
                  className={`bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] ${
                    isTextOnly ? 'text-left' : 'text-center'
                  }`}
                >
                  {textOnlyTitle ? (
                    <Heading as="h1" className="font-28 text-fg m-0 mb-8 text-left font-sans">
                      {textOnlyTitle}
                    </Heading>
                  ) : null}
                  {hero ? (
                    <>
                      <Section className="mb-3 text-center">
                        <Img
                          src={emailLogoUrl()}
                          alt={FORMSSI_EMAIL_BRAND.productName}
                          width={96}
                          className="mx-auto mb-5 block"
                        />
                      </Section>
                      {hero.eyebrow ? (
                        <Text className="font-13 text-fg-3 mt-0 mb-6 font-sans">{hero.eyebrow}</Text>
                      ) : null}
                      <Heading as="h1" className="font-28 text-fg m-0 mb-8 font-sans">
                        {hero.title}
                      </Heading>
                      {hero.description ? (
                        <Text className="font-16 text-fg-2 mx-auto mt-0 mb-8 max-w-[420px] text-center font-sans">
                          {hero.description}
                        </Text>
                      ) : null}
                      {hero.ctaLabel && hero.ctaUrl ? (
                        <Section className="mb-6 text-center">
                          <Button
                            href={hero.ctaUrl}
                            className="bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6"
                          >
                            {hero.ctaLabel}
                          </Button>
                        </Section>
                      ) : null}
                      {hero.disclaimer ? (
                        <Text className="font-13 text-fg-3 mx-auto mt-8 mb-0 max-w-[400px] text-center font-sans">
                          {hero.disclaimer}
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                  {children}
                </Section>
              )}

              <BareboneFooter />
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export const EMAIL_BUTTON_CLASS =
  'bg-fg font-16 text-fg-inverted inline-block rounded-lg px-7 py-4 text-center font-sans leading-6';
