'use client';

import { ReactNode } from 'react';
import { I18nProvider as SharedI18nProvider } from '@repo/i18n/provider';
import { SHARED_MESSAGES, mergeTranslations } from '@repo/i18n';
import frTranslations from '@/i18n/messages/fr.json';
import enTranslations from '@/i18n/messages/en.json';
import { landingContentMessages } from '@/i18n/landing-content';

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <SharedI18nProvider
      sharedMessages={SHARED_MESSAGES}
      messages={{
        fr: mergeTranslations(frTranslations, landingContentMessages.fr),
        en: mergeTranslations(enTranslations, landingContentMessages.en),
      }}
    >
      {children}
    </SharedI18nProvider>
  );
}

export { useLanguage } from '@repo/i18n/provider';
