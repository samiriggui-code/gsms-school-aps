import { enUS, fr, type Locale } from 'date-fns/locale';

const DATE_FNS_LOCALES: Record<string, Locale> = {
  fr,
  en: enUS,
};

export function getDateFnsLocale(languageCode: string): Locale {
  return DATE_FNS_LOCALES[languageCode] ?? fr;
}
