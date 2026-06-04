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
  return raw
    .filter((item) => item && typeof item === 'object' && typeof (item as LandingSectionConfig).type === 'string')
    .map((item) => {
      const s = item as LandingSectionConfig;
      return {
        type: s.type,
        title: s.title ?? LANDING_SECTION_CATALOG.find((c) => c.type === s.type)?.label ?? s.type,
        enabled: s.enabled !== false,
      };
    });
}

export function landingSectionLabel(section: LandingSectionConfig): string {
  return section.title ?? LANDING_SECTION_CATALOG.find((c) => c.type === section.type)?.label ?? section.type;
}
