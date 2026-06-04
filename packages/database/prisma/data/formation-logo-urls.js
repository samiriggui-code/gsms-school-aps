'use strict';

/**
 * URLs publiques des logos par slug catalogue.
 * Fichiers servis depuis `apps/lms-crm/public/formations` (Next.js).
 * RAN / recyclage : même visuel que l’initiale (fichiers dupliqués par slug).
 */
const BY_SLUG = Object.freeze({
  'tfp-aps': '/formations/tfp-aps.png',
  'mac-aps': '/formations/mac-aps.png',
  'asra-d': '/formations/asra-d.png',
  ovt: '/formations/ovt.jpeg',
  'mac-ovt': '/formations/mac-ovt.jpeg',
  /** Logo vitrine CRM / landing ; à remplacer par un visuel dédié si besoin */
  'asc-cynophile': '/formations/asra-d.png',
  'h0-b0': '/formations/h0-b0.jpg',
  'bs-be-manoeuvre': '/formations/bs-be-manoeuvre.jpg',
  br: '/formations/br.jpg',
  'ssiap-1-initial': '/formations/ssiap-1-initial.jpg',
  'ssiap-1-recyclage': '/formations/ssiap-1-recyclage.jpg',
  'ssiap-1-ran': '/formations/ssiap-1-ran.jpg',
  'ssiap-2-initial': '/formations/ssiap-2-initial.png',
  'ssiap-2-recyclage': '/formations/ssiap-2-recyclage.png',
  'ssiap-2-ran': '/formations/ssiap-2-ran.png',
  'ssiap-3-initial': '/formations/ssiap-3-initial.png',
  'ssiap-3-recyclage': '/formations/ssiap-3-recyclage.png',
  'ssiap-3-ran': '/formations/ssiap-3-ran.png',
  'sst-initial': '/formations/sst-initial.jpg',
  'mac-sst': '/formations/mac-sst.jpg',
  stu: '/formations/stu.jpg',
  'sst-entreprise': '/formations/sst-entreprise.jpg',
  'guide-file-serre-file': '/formations/guide-file-serre-file.jpg',
  ari: '/formations/ari.jpg',
  'manipulation-extincteur': '/formations/manipulation-extincteur.jpg',
  esi: '/formations/esi.jpg',
  ssi: '/formations/ssi.jpg',
  cssi: '/formations/cssi.jpg',
  'evacuation-incendie': '/formations/evacuation-incendie.jpg',
  epi: '/formations/epi.jpg',
  'commission-securite': '/formations/commission-securite.jpg',
  'intra-entreprise-securite': '/formations/intra-entreprise-securite.png',
});

function logoPublicUrlForFormationSlug(slug) {
  if (slug == null || typeof slug !== 'string') return null;
  const key = slug.trim();
  if (!key) return null;
  return BY_SLUG[key] ?? null;
}

module.exports = {
  logoPublicUrlForFormationSlug,
  FORMATION_LOGO_URL_BY_SLUG: BY_SLUG,
};
