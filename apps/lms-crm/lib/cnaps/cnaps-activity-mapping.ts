import type { FormationParcoursSpecialite } from '@repo/database';
import { CNAPS_CHECKBOXES } from '@/lib/cnaps/cnaps-form-coordinates';

type CheckboxKey = keyof typeof CNAPS_CHECKBOXES;

/** Activités CNAPS (page 4) dérivées du slug / parcours catalogue. */
export function resolveCnapsActivityCheckboxes(input: {
  formationSlug: string | null;
  track: string | null;
  parcoursSpecialite: FormationParcoursSpecialite | string | null;
}): CheckboxKey[] {
  const slug = (input.formationSlug ?? '').toLowerCase();
  const track = (input.track ?? '').toLowerCase();

  if (slug.includes('ovt') || slug.includes('videoprotection') || slug.includes('telesurveillance')) {
    return ['activityVideoprotection', 'activityTelesurveillance'];
  }

  if (
    slug.includes('tfp') ||
    slug.includes('aps') ||
    slug.includes('mac-aps') ||
    track.includes('securite') ||
    slug.includes('gardiennage')
  ) {
    return ['activityGardiennageSimple'];
  }

  if (slug.includes('cyno') || slug.includes('chien')) {
    return ['activityGardiennageSimple', 'formationAjoutChien'];
  }

  return [];
}

export function resolveCnapsFormationTypeCheckbox(input: {
  parcoursSpecialite: FormationParcoursSpecialite | string | null;
  formationSlug: string | null;
}): CheckboxKey {
  const slug = (input.formationSlug ?? '').toLowerCase();
  const spec = String(input.parcoursSpecialite ?? '').toUpperCase();

  if (spec === 'MAC' || slug.includes('mac-')) return 'formationMac';
  if (slug.includes('vae')) return 'formationVae';
  if (slug.includes('cyno') || slug.includes('chien')) return 'formationAjoutChien';
  return 'formationInitiale';
}
