'use client';

import { ReactNode } from 'react';
import { I18nProvider as SharedI18nProvider } from '@repo/i18n/provider';
import { SHARED_MESSAGES, mergeTranslations } from '@repo/i18n';
import frTranslations from '@/i18n/messages/fr.json';
import enTranslations from '@/i18n/messages/en.json';
import landingFr from '@/i18n/messages-landing/fr.json';
import landingEn from '@/i18n/messages-landing/en.json';
import { landingContentMessages } from '@/i18n/landing-content';
import { MENU_BY_PATH_EN, MENU_BY_PATH_FR } from '@/i18n/menu-by-path';
import { PAGE_DESCRIPTIONS_EN, PAGE_DESCRIPTIONS_FR } from '@/i18n/page-descriptions';

const crmMessages = {
  fr: mergeTranslations(
    frTranslations as Record<string, unknown>,
    {
      menu: { byPath: MENU_BY_PATH_FR },
      pages: {
        ...(frTranslations.pages as Record<string, unknown>),
        descriptions: PAGE_DESCRIPTIONS_FR,
      },
    },
    landingFr as Record<string, unknown>,
    landingContentMessages.fr,
  ),
  en: mergeTranslations(
    enTranslations as Record<string, unknown>,
    {
      menu: { byPath: MENU_BY_PATH_EN },
      pages: {
        ...(enTranslations.pages as Record<string, unknown>),
        descriptions: PAGE_DESCRIPTIONS_EN,
      },
    },
    landingEn as Record<string, unknown>,
    landingContentMessages.en,
  ),
};

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <SharedI18nProvider
      sharedMessages={SHARED_MESSAGES}
      messages={crmMessages}
    >
      {children}
    </SharedI18nProvider>
  );
}

export { useLanguage } from '@repo/i18n/provider';
