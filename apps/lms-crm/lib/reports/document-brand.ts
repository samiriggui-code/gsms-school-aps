import { loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import { getAvatarUrl, toAbsoluteUrl } from '@/lib/helpers';
import { DEFAULT_ORGANIZATION_BRAND } from '@/lib/reports/default-brand';

export type ReportDocumentBrand = {
  companyName: string;
  tagline: string;
  logoUrl: string;
  iconUrl: string;
  qualiopiLogoUrl: string | null;
  addressLine: string;
  legalLine: string;
  contactLine: string;
};

function withOrigin(path: string, origin?: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  if (!origin) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin.replace(/\/$/, '')}${normalized}`;
}

function joinParts(parts: (string | null | undefined)[], separator: string): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(separator);
}

/** Adresse organisme sans doublon code postal / ville déjà présents dans la rue. */
export function buildOrganizationAddressLine(settings: {
  address?: string | null;
  companyPostalCode?: string | null;
  companyCity?: string | null;
  companyRegion?: string | null;
} | null | undefined): string {
  const street = settings?.address?.trim() ?? '';
  const locality = [settings?.companyPostalCode?.trim(), settings?.companyCity?.trim()]
    .filter(Boolean)
    .join(' ');
  const region = settings?.companyRegion?.trim() ?? '';
  const streetLower = street.toLowerCase();
  const parts: string[] = [];
  if (street) parts.push(street);
  if (locality && !streetLower.includes(locality.toLowerCase())) parts.push(locality);
  if (region && !streetLower.includes(region.toLowerCase())) parts.push(region);
  return parts.join(' · ');
}

/** Identité organisme (SystemSetting) pour en-tête / pied de page des documents imprimables. */
export async function loadReportDocumentBrand(origin?: string): Promise<ReportDocumentBrand> {
  const settings = await loadSystemSettings();

  const companyName = settings?.name?.trim() || DEFAULT_ORGANIZATION_BRAND.productName;
  const tagline =
    settings?.mainActivityDescription?.trim() ||
    settings?.industry?.trim() ||
    DEFAULT_ORGANIZATION_BRAND.tagline;

  const addressLine = buildOrganizationAddressLine(settings);

  const legalLine = joinParts(
    [
      settings?.siret?.trim() ? `SIRET ${settings.siret.trim()}` : null,
      settings?.ndaNumber?.trim() ? `NDA ${settings.ndaNumber.trim()}` : null,
      settings?.agreementQualiopiRef?.trim()
        ? `Qualiopi ${settings.agreementQualiopiRef.trim()}`
        : null,
    ],
    ' · ',
  );

  const website = settings?.websiteURL?.trim().replace(/^https?:\/\//i, '') || '';
  const contactLine = joinParts(
    [settings?.supportPhone?.trim(), settings?.supportEmail?.trim(), website || null],
    ' · ',
  );

  const logoUrl = withOrigin(
    settings?.logo?.trim()
      ? getAvatarUrl(settings.logo)
      : toAbsoluteUrl('/brand/formssi-logo-full.png'),
    origin,
  );
  const iconUrl = withOrigin(toAbsoluteUrl('/brand/formssi-icon.png'), origin);
  const qualiopiLogoUrl = settings?.agreementQualiopiRef?.trim()
    ? withOrigin(toAbsoluteUrl('/images/certifications/logo-qualiopi.png'), origin)
    : null;

  return {
    companyName,
    tagline,
    logoUrl,
    iconUrl,
    qualiopiLogoUrl,
    addressLine,
    legalLine,
    contactLine,
  };
}
