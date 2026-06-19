/**
 * Domaines prod pour allowedDevOrigins / serverActions.allowedOrigins (reverse proxy Traefik).
 * Lit DOMAIN, NEXT_PUBLIC_SITE_URL, NEXTAUTH_URL, CRM_HOST au build Docker.
 */
function addHost(set, value) {
  const raw = value?.trim();
  if (!raw) return;

  try {
    const url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(`https://${raw}`);
    if (url.host) set.add(url.host);
    if (url.hostname) {
      set.add(url.hostname);
      if (!url.hostname.startsWith('www.')) {
        set.add(`www.${url.hostname}`);
      }
    }
  } catch {
    set.add(raw.replace(/^https?:\/\//i, '').replace(/\/$/, ''));
  }
}

export function getProductionAllowedOrigins() {
  const hosts = new Set();
  for (const key of [
    'DOMAIN',
    'CRM_HOST',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_CRM_URL',
    'NEXTAUTH_URL',
  ]) {
    addHost(hosts, process.env[key]);
  }
  return [...hosts];
}
