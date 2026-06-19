import { FORMSSI_EMAIL_BRAND } from './brand';

/** Origine absolue des images statiques dans les e-mails transactionnels. */
export function resolveEmailAssetsOrigin(fallbackOrigin?: string): string {
  const origin =
    process.env.EMAIL_ASSETS_ORIGIN?.trim() ||
    fallbackOrigin?.trim() ||
    process.env.NEXT_PUBLIC_CRM_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    FORMSSI_EMAIL_BRAND.siteUrl;
  return origin.replace(/\/$/, '');
}

export function getEmailAssetsOrigin(): string {
  return resolveEmailAssetsOrigin();
}

export function emailLogoUrl(origin?: string): string {
  const base = (origin ?? getEmailAssetsOrigin()).replace(/\/$/, '');
  return `${base}${FORMSSI_EMAIL_BRAND.logoPath}`;
}

export function emailIconUrl(origin?: string): string {
  const base = (origin ?? getEmailAssetsOrigin()).replace(/\/$/, '');
  return `${base}${FORMSSI_EMAIL_BRAND.iconPath}`;
}

export function emailSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ?? FORMSSI_EMAIL_BRAND.siteUrl
  );
}
