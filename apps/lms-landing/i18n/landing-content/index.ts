import { mergeTranslations } from '@repo/i18n';
import { sectionsMessages } from './sections';
import { trainersMessages } from './trainers';
import { pricingMessages } from './pricing';
import { preinscriptionMessages } from './preinscription';
import { quoteMessages } from './quote';
import { sheetsMessages } from './sheets';
import { sheetContentMessages } from './sheet-content';

export const landingContentMessages = {
  fr: mergeTranslations(
    sectionsMessages.fr,
    trainersMessages.fr,
    pricingMessages.fr,
    preinscriptionMessages.fr,
    quoteMessages.fr,
    sheetsMessages.fr,
    sheetContentMessages.fr,
  ),
  en: mergeTranslations(
    sectionsMessages.en,
    trainersMessages.en,
    pricingMessages.en,
    preinscriptionMessages.en,
    quoteMessages.en,
    sheetsMessages.en,
    sheetContentMessages.en,
  ),
};

export { sectionsMessages } from './sections';
export { trainersMessages } from './trainers';
export { pricingMessages } from './pricing';
export { preinscriptionMessages } from './preinscription';
export { quoteMessages } from './quote';
export { sheetsMessages } from './sheets';
export { sheetContentMessages } from './sheet-content';
