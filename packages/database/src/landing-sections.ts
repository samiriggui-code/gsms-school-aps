/** Sections one-page landing — partagées CRM CMS et site public. */

export type LandingSectionConfig = {
  type: string;
  title?: string;
  enabled?: boolean;
};

export const LANDING_SECTION_CATALOG: { type: string; label: string }[] = [
  { type: 'hero', label: 'Hero' },
  { type: 'trusted-brands', label: 'Marques de confiance' },
  { type: 'how-it-works', label: 'Comment ça marche' },
  { type: 'features', label: 'Atouts' },
  { type: 'trainers', label: 'Formateurs' },
  { type: 'testimonials', label: 'Témoignages' },
  { type: 'catalogue', label: 'Catalogue formations' },
  { type: 'faq', label: 'FAQ' },
  { type: 'call-to-action', label: 'Appel à action' },
  { type: 'contact', label: 'Contact' },
];

export const DEFAULT_LANDING_SECTIONS: LandingSectionConfig[] = [
  { type: 'hero', title: "Accueil FORM'SSI", enabled: true },
  { type: 'trusted-brands', title: 'Marques de confiance', enabled: true },
  { type: 'how-it-works', title: 'Comment ça marche', enabled: true },
  { type: 'features', title: 'Atouts', enabled: true },
  { type: 'trainers', title: 'Formateurs', enabled: true },
  { type: 'testimonials', title: 'Témoignages', enabled: true },
  { type: 'catalogue', title: 'Catalogue formations', enabled: true },
  { type: 'faq', title: 'FAQ', enabled: true },
  { type: 'call-to-action', title: 'Appel à action', enabled: true },
  { type: 'contact', title: 'Contact', enabled: true },
];

export function normalizeLandingSections(raw: unknown): LandingSectionConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_LANDING_SECTIONS;
  const parsed = raw
    .filter((item) => item && typeof item === 'object' && typeof (item as LandingSectionConfig).type === 'string')
    .map((item) => {
      const s = item as LandingSectionConfig;
      const type = normalizeSectionType(String(s.type));
      return {
        type,
        title: s.title ?? LANDING_SECTION_CATALOG.find((c) => c.type === type)?.label ?? type,
        enabled: s.enabled !== false,
      };
    });
  return mergeLandingSectionsWithDefaults(parsed);
}

export function landingSectionLabel(section: LandingSectionConfig): string {
  return section.title ?? LANDING_SECTION_CATALOG.find((c) => c.type === section.type)?.label ?? section.type;
}

const KNOWN_SECTION_TYPES = new Set([
  ...LANDING_SECTION_CATALOG.map((c) => c.type),
  'pricing', // alias historique → catalogue
]);

function normalizeSectionType(type: string): string {
  return type === 'pricing' ? 'catalogue' : type;
}

/**
 * Complète la config CMS/DB avec toutes les sections du catalogue par défaut
 * (ordre CMS conservé, blocs manquants ajoutés à la fin, enabled conservé).
 */
export function mergeLandingSectionsWithDefaults(
  fromDb: LandingSectionConfig[],
): LandingSectionConfig[] {
  if (!fromDb?.length) return DEFAULT_LANDING_SECTIONS;

  const seen = new Set<string>();
  const merged: LandingSectionConfig[] = [];

  for (const item of fromDb) {
    if (!item?.type) continue;
    const type = normalizeSectionType(String(item.type));
    if (!KNOWN_SECTION_TYPES.has(type) && !KNOWN_SECTION_TYPES.has(String(item.type))) continue;
    if (seen.has(type)) continue;
    seen.add(type);
    const def = DEFAULT_LANDING_SECTIONS.find((d) => d.type === type);
    merged.push({
      type,
      title: item.title ?? def?.title ?? landingSectionLabel({ type, title: type }),
      enabled: item.enabled !== false,
    });
  }

  for (const def of DEFAULT_LANDING_SECTIONS) {
    if (!seen.has(def.type)) {
      merged.push({ ...def });
    }
  }

  return merged;
}
