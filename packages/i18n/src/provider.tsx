'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  I18N_DEFAULT_LANGUAGE,
  I18N_LANGUAGES,
  I18N_LOCAL_STORAGE_KEY,
  normalizeLanguageCode,
} from './config';
import { mergeTranslations } from './merge';

export type AppI18nMessages = {
  fr: Record<string, unknown>;
  en: Record<string, unknown>;
};

export type I18nProviderProps = {
  children: ReactNode;
  messages: AppI18nMessages;
  sharedMessages?: AppI18nMessages;
};

function buildResources(shared: AppI18nMessages | undefined, app: AppI18nMessages) {
  return {
    fr: { translation: mergeTranslations(shared?.fr ?? {}, app.fr) },
    en: { translation: mergeTranslations(shared?.en ?? {}, app.en) },
  };
}

export function I18nProvider({ children, messages, sharedMessages }: I18nProviderProps) {
  useEffect(() => {
    if (i18n.isInitialized) return;

    const resources = buildResources(sharedMessages, messages);

    void i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        supportedLngs: ['fr', 'en'],
        fallbackLng: I18N_DEFAULT_LANGUAGE,
          debug: false,
        interpolation: { escapeValue: false },
        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          caches: ['localStorage'],
          lookupLocalStorage: I18N_LOCAL_STORAGE_KEY,
        },
        react: { useSuspense: false },
      })
      .then(() => {
        const normalized = normalizeLanguageCode(i18n.language);
        if (i18n.language !== normalized) {
          void i18n.changeLanguage(normalized);
        }
      });
  }, [messages, sharedMessages]);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const language = I18N_LANGUAGES.find((lang) => lang.code === lng);
      if (language?.direction) {
        document.documentElement.setAttribute('dir', language.direction);
        document.documentElement.setAttribute('lang', lng);
      }
    };

    if (i18n.language) {
      handleLanguageChange(i18n.language);
    }

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const currentLanguage =
    I18N_LANGUAGES.find((lang) => lang.code === (i18n.language || I18N_DEFAULT_LANGUAGE)) ||
    I18N_LANGUAGES[0];

  return (
    <I18nextProvider i18n={i18n}>
      <RadixDirectionProvider dir={currentLanguage.direction}>{children}</RadixDirectionProvider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  const [languageCode, setLanguageCode] = useState(i18n.language || I18N_DEFAULT_LANGUAGE);
  const [currentLanguage, setCurrentLanguage] = useState(
    () =>
      I18N_LANGUAGES.find((lang) => lang.code === (i18n.language || I18N_DEFAULT_LANGUAGE)) ||
      I18N_LANGUAGES[0],
  );

  useEffect(() => {
    const handleChange = (lng: string) => {
      const normalized = normalizeLanguageCode(lng);
      setLanguageCode(normalized);
      setCurrentLanguage(
        I18N_LANGUAGES.find((lang) => lang.code === normalized) || I18N_LANGUAGES[0],
      );
    };

    handleChange(i18n.language || I18N_DEFAULT_LANGUAGE);
    i18n.on('languageChanged', handleChange);
    return () => {
      i18n.off('languageChanged', handleChange);
    };
  }, []);

  const changeLanguage = useCallback((code: string) => {
    return i18n.changeLanguage(normalizeLanguageCode(code));
  }, []);

  return {
    languageCode,
    language: currentLanguage,
    changeLanguage,
  };
}
