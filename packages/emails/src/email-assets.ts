import { FORMSSI_EMAIL_BRAND } from './brand';

export function getEmailAssetsOrigin(): string {
  const fromEnv = process.env.EMAIL_ASSETS_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, '');
  return FORMSSI_EMAIL_BRAND.siteUrl.replace(/\/$/, '');
}

export function emailLogoUrl(origin?: string): string {
  const base = (origin ?? getEmailAssetsOrigin()).replace(/\/$/, '');
  return `${base}${FORMSSI_EMAIL_BRAND.logoPath}`;
}

export function emailSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ?? FORMSSI_EMAIL_BRAND.siteUrl;
}
