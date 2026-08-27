'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
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

function readClientLanguage(): string {
  if (typeof window === 'undefined') return I18N_DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(I18N_LOCAL_STORAGE_KEY);
    if (stored) return normalizeLanguageCode(stored);
  } catch {
    /* ignore */
  }
  return I18N_DEFAULT_LANGUAGE;
}

/**
 * Init synchrone avant le premier rendu enfant.
 * Avant : init dans useEffect → useTranslation() en SSR (BrandedLayout /signin)
 * suspendait pour toujours (useSuspense défaut true, Promise jamais résolue).
 */
function ensureI18nReady(shared: AppI18nMessages | undefined, app: AppI18nMessages) {
  const resources = buildResources(shared, app);

  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next);
    void i18n.init({
      resources,
      lng: readClientLanguage(),
      supportedLngs: ['fr', 'en'],
      fallbackLng: I18N_DEFAULT_LANGUAGE,
      debug: false,
      interpolation: { escapeValue: false },
      // Critique : pas de Suspense — sinon hang HTTP zéro octet sur (auth)
      react: { useSuspense: false },
      // Init synchrone dans le thread courant
      initImmediate: false,
    });
    return;
  }

  // Hot reload / nouveau bundle messages : rafraîchir les ressources
  for (const lng of ['fr', 'en'] as const) {
    i18n.addResourceBundle(lng, 'translation', resources[lng].translation, true, true);
  }
}

export function I18nProvider({ children, messages, sharedMessages }: I18nProviderProps) {
  ensureI18nReady(sharedMessages, messages);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      const language = I18N_LANGUAGES.find((lang) => lang.code === lng);
      if (language?.direction) {
        document.documentElement.setAttribute('dir', language.direction);
        document.documentElement.setAttribute('lang', lng);
      }
      try {
        window.localStorage.setItem(I18N_LOCAL_STORAGE_KEY, normalizeLanguageCode(lng));
      } catch {
        /* ignore */
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
