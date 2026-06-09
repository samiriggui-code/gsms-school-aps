export {
  I18N_LANGUAGES,
  I18N_LANGUAGE_CODES,
  I18N_DEFAULT_LANGUAGE,
  I18N_LOCAL_STORAGE_KEY,
  normalizeLanguageCode,
  type Language,
} from './config';
export { getDateFnsLocale } from './date-locale';
export { mergeTranslations } from './merge';
export { useTranslation, useTypedTranslation, default } from './hooks';
export type { TFunction } from 'i18next';
export { SHARED_MESSAGES, sharedFr, sharedEn } from './shared-messages';
