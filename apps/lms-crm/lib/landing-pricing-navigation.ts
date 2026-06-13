/** Onglets de la section « Nos parcours » (#pricing). */
export const LANDING_PRICING_TABS = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
] as const;

export type LandingPricingTab = (typeof LANDING_PRICING_TABS)[number];

export const LANDING_PRICING_TAB_EVENT = 'formssi:pricing-tab';

export function isLandingPricingTab(value: string): value is LandingPricingTab {
  return (LANDING_PRICING_TABS as readonly string[]).includes(value);
}

function scrollToPricingSection() {
  const element = document.getElementById('pricing');
  if (!element) return;

  const headerOffset = 88;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const top = element.getBoundingClientRect().top + window.scrollY - headerOffset;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduced || coarse ? 'auto' : 'smooth',
  });
}

/**
 * Active un volet formations sans navigation Next (évite GET /?tab=… en boucle / prefetch).
 * Met à jour l’URL avec replaceState pour garder un lien partageable.
 */
export function navigateToPricingTab(tab: LandingPricingTab) {
  if (typeof window === 'undefined') return;

  const onHome = window.location.pathname === '/' || window.location.pathname === '';
  if (onHome) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    const next = `${url.pathname}?${url.searchParams.toString()}`;
    window.history.replaceState(window.history.state, '', next);
  }

  window.dispatchEvent(new CustomEvent(LANDING_PRICING_TAB_EVENT, { detail: tab }));
  requestAnimationFrame(() => scrollToPricingSection());
}
