/** Mintlify `@lms/docs` — `pnpm --filter @lms/docs dev` (port 3002 par défaut). */
const defaultDocsOrigin =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_LMS_DOCS_URL
    ? process.env.NEXT_PUBLIC_LMS_DOCS_URL.replace(/\/$/, '')
    : 'http://localhost:3002';

const generalSettings = {
  /** Documentation produit (apps/lms-docs). */
  docsLink: `${defaultDocsOrigin}/introduction`,
  /** Page Mintlify liée à l’aide catalogue / support CRM. */
  docsHelpCatalogLink: `${defaultDocsOrigin}/crm/aide-catalogue-formations`,
  purchaseLink: 'https://1.envato.market/Vm7VRE',
  licenseLink: '',
  devsLink: 'https://devs.keenthemes.com',
  faqLink: 'https://keenthemes.com/metronic',
  aboutLink: 'https://keenthemes.com/metronic',
};

export { generalSettings };
