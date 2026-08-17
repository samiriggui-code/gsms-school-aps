export type EinvoiceModuleSettings = {
  /** Profil Factur-X cible : MINIMUM | BASIC | EN16931 */
  profile: 'MINIMUM' | 'BASIC' | 'EN16931';
  /** Identifiant / slug PDP partenaire (à brancher API). */
  pdpProvider: string;
  /** Mode sandbox PDP. */
  pdpSandbox: boolean;
  /** Exiger SIRET client avant génération. */
  requireBuyerSiret: boolean;
  /** Note opérationnelle affichée dans les paramètres. */
  notes: string;
};

export const DEFAULT_EINVOICE_SETTINGS: EinvoiceModuleSettings = {
  profile: 'BASIC',
  pdpProvider: '',
  pdpSandbox: true,
  requireBuyerSiret: true,
  notes:
    'Réception e-facture obligatoire au 1er septembre 2026. Brancher une PDP agréée avant mise en production.',
};

export function mergeEinvoiceSettings(raw: unknown): EinvoiceModuleSettings {
  const base = { ...DEFAULT_EINVOICE_SETTINGS };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  if (o.profile === 'MINIMUM' || o.profile === 'BASIC' || o.profile === 'EN16931') {
    base.profile = o.profile;
  }
  if (typeof o.pdpProvider === 'string') base.pdpProvider = o.pdpProvider.trim();
  if (typeof o.pdpSandbox === 'boolean') base.pdpSandbox = o.pdpSandbox;
  if (typeof o.requireBuyerSiret === 'boolean') base.requireBuyerSiret = o.requireBuyerSiret;
  if (typeof o.notes === 'string') base.notes = o.notes;
  return base;
}
