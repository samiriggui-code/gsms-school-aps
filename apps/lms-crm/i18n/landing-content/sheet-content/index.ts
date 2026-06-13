import { mergeTranslations } from '@repo/i18n';
import { sheetContentCommonMessages } from './common';
import { sheetContentTfpMessages } from './tfp';
import { sheetContentSstMessages } from './sst';
import { sheetContentSsiapMessages } from './ssiap';
import { sheetContentHabilitationMessages } from './habilitation';
import { sheetContentEntrepriseMessages } from './entreprise';
import { sheetContentAutresMessages } from './autres';
import { sheetContentMacApsMessages } from './mac-aps';
import { sheetContentMacOvtMessages } from './mac-ovt';
import { sheetContentAsraMessages } from './asra';
import { sheetContentOvtMessages } from './ovt';
import { sheetContentCynophileMessages } from './cynophile';
import { sheetContentBsBeMessages } from './bs-be';

export const sheetContentMessages = {
  fr: mergeTranslations(
    sheetContentCommonMessages.fr,
    sheetContentTfpMessages.fr,
    sheetContentSstMessages.fr,
    sheetContentSsiapMessages.fr,
    sheetContentHabilitationMessages.fr,
    sheetContentEntrepriseMessages.fr,
    sheetContentAutresMessages.fr,
    sheetContentMacApsMessages.fr,
    sheetContentMacOvtMessages.fr,
    sheetContentAsraMessages.fr,
    sheetContentOvtMessages.fr,
    sheetContentCynophileMessages.fr,
    sheetContentBsBeMessages.fr,
  ),
  en: mergeTranslations(
    sheetContentCommonMessages.en,
    sheetContentTfpMessages.en,
    sheetContentSstMessages.en,
    sheetContentSsiapMessages.en,
    sheetContentHabilitationMessages.en,
    sheetContentEntrepriseMessages.en,
    sheetContentAutresMessages.en,
    sheetContentMacApsMessages.en,
    sheetContentMacOvtMessages.en,
    sheetContentAsraMessages.en,
    sheetContentOvtMessages.en,
    sheetContentCynophileMessages.en,
    sheetContentBsBeMessages.en,
  ),
};

export { sheetContentCommonMessages } from './common';
export { sheetContentTfpMessages } from './tfp';
export { sheetContentSstMessages } from './sst';
export { sheetContentSsiapMessages } from './ssiap';
export { sheetContentHabilitationMessages } from './habilitation';
export { sheetContentEntrepriseMessages } from './entreprise';
export { sheetContentAutresMessages } from './autres';
export { sheetContentMacApsMessages } from './mac-aps';
export { sheetContentMacOvtMessages } from './mac-ovt';
export { sheetContentAsraMessages } from './asra';
export { sheetContentOvtMessages } from './ovt';
export { sheetContentCynophileMessages } from './cynophile';
export { sheetContentBsBeMessages } from './bs-be';
