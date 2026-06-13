const defaultAppOrigin =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : 'http://localhost:3001';

const defaultDocsOrigin =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_LMS_DOCS_URL
    ? process.env.NEXT_PUBLIC_LMS_DOCS_URL.replace(/\/$/, '')
    : defaultAppOrigin;

const generalSettings = {
  /** Documentation produit intégrée (`content/docs`, rendu `/docs`). */
  docsLink: `${defaultDocsOrigin}/docs/introduction`,
  docsHelpCatalogLink: `${defaultDocsOrigin}/docs/crm/aide-catalogue-formations`,
  purchaseLink: 'https://1.envato.market/Vm7VRE',
  licenseLink: '',
  devsLink: 'https://devs.keenthemes.com',
  faqLink: 'https://keenthemes.com/metronic',
  aboutLink: 'https://keenthemes.com/metronic',
};

export { generalSettings };
