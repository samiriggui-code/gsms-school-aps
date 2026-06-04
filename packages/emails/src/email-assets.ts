import { createRequire } from 'node:module';
import { FORMSSI_EMAIL_BRAND } from './brand';

const requireFs = createRequire(import.meta.url);

function embedOrUrl(candidates: string[], buildUrl: () => string): string {
  if (process.env.EMAIL_EMBED_ASSETS !== 'true') {
    return buildUrl();
  }
  try {
    const { readMonorepoAssetAsDataUri } = requireFs('./email-assets-fs.js') as typeof import('./email-assets-fs');
    return readMonorepoAssetAsDataUri(candidates) ?? buildUrl();
  } catch {
    return buildUrl();
  }
}

export function getEmailAssetsOrigin(): string {
  const fromEnv = process.env.EMAIL_ASSETS_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, '');
  return FORMSSI_EMAIL_BRAND.siteUrl.replace(/\/$/, '');
}

export function emailLogoUrl(origin?: string): string {
  return embedOrUrl(
    [
      'apps/lms-landing/public/app/mini-logo-primary.svg',
      'apps/lms-landing/public/app/default-logo.svg',
    ],
    () => {
      const base = (origin ?? getEmailAssetsOrigin()).replace(/\/$/, '');
      return `${base}${FORMSSI_EMAIL_BRAND.logoPath}`;
    },
  );
}

export function emailSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ?? FORMSSI_EMAIL_BRAND.siteUrl;
}
