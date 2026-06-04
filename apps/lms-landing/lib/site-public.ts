/** URL publique du site (CGV, liens dans les e-mails). Surcharge : `NEXT_PUBLIC_SITE_URL`. */
const DEFAULT_PUBLIC_SITE = 'https://formssi.online';

export function getFormssiSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return DEFAULT_PUBLIC_SITE;
}

export function getFormssiSiteHostLabel(): string {
  try {
    return new URL(getFormssiSiteUrl()).host;
  } catch {
    return 'formssi.online';
  }
}
