export interface Language {
  code: string;
  name: string;
  shortName: string;
  direction: 'ltr' | 'rtl';
  /** Public URL path to flag SVG (each app serves its own `/media/flags/*`). */
  flag: string;
}

/** Langues actives LMS — FR + EN uniquement. */
export const I18N_LANGUAGES: Language[] = [
  {
    code: 'fr',
    name: 'Français',
    shortName: 'FR',
    direction: 'ltr',
    flag: '/media/flags/france.svg',
  },
  {
    code: 'en',
    name: 'English',
    shortName: 'EN',
    direction: 'ltr',
    flag: '/media/flags/united-states.svg',
  },
];

export const I18N_LANGUAGE_CODES = I18N_LANGUAGES.map((lang) => lang.code);

export const I18N_DEFAULT_LANGUAGE = 'fr';

export const I18N_LOCAL_STORAGE_KEY = 'language';

export function normalizeLanguageCode(code: string | undefined): string {
  if (code && I18N_LANGUAGE_CODES.includes(code)) return code;
  return I18N_DEFAULT_LANGUAGE;
}
