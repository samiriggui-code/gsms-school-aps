import {
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
  LANDING_QUOTE_LEAD_SOURCE,
} from '@repo/database/browser';

/** Libellés courts pour l’UI (badges, filtres). */
export const LANDING_SOURCE_SHORT_LABEL: Record<string, string> = {
  [LANDING_QUOTE_LEAD_SOURCE]: 'Devis',
  [LANDING_PREINSCRIPTION_LEAD_SOURCE]: 'Préinscription',
};

export const LEAD_STATUS_LABEL_FR: Record<string, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUALIFIED: 'Qualifié',
  CONVERTED: 'Converti',
  LOST: 'Perdu',
};
