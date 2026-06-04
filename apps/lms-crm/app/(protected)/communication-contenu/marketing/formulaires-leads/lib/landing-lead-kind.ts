import { LANDING_PREINSCRIPTION_LEAD_SOURCE, LANDING_QUOTE_LEAD_SOURCE } from '@repo/database/browser';

export type LandingLeadKindFilter = 'all' | 'quote' | 'preinscription';

export function landingLeadKindFromSource(source: string | null | undefined): 'quote' | 'preinscription' | null {
  if (source === LANDING_QUOTE_LEAD_SOURCE) return 'quote';
  if (source === LANDING_PREINSCRIPTION_LEAD_SOURCE) return 'preinscription';
  return null;
}
