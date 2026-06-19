import { getFormssiSiteUrl } from '@/lib/site-public';

/** Chemins docs relatifs — valides sur tout FQDN (pas d’URL absolue figée au build). */
export const DOCS_ROUTES = {
  introduction: '/docs/introduction',
  helpCatalog: '/docs/crm/aide-catalogue-formations',
} as const;

const generalSettings = {
  /** Documentation produit intégrée (`content/docs`, rendu `/docs`). */
  docsLink: DOCS_ROUTES.introduction,
  docsHelpCatalogLink: DOCS_ROUTES.helpCatalog,
  purchaseLink: 'https://1.envato.market/Vm7VRE',
  licenseLink: '',
  devsLink: 'https://devs.keenthemes.com',
  faqLink: 'https://keenthemes.com/metronic',
  aboutLink: 'https://keenthemes.com/metronic',
};

/** URL absolue docs (e-mails, écran intégrations) — dérivée de `NEXT_PUBLIC_SITE_URL`. */
export function getDocsPublicUrl(path: string = DOCS_ROUTES.introduction): string {
  const override = process.env.NEXT_PUBLIC_LMS_DOCS_URL?.trim();
  if (override && path === DOCS_ROUTES.introduction) {
    return override.replace(/\/$/, '');
  }
  const base = getFormssiSiteUrl().replace(/\/$/, '');
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${base}${route}`;
}

export { generalSettings };
