import { loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import { getAvatarUrl } from '@/lib/helpers';

/** Forme attendue par les templates fiche / contrat existants. */
export async function loadCompanyProfileForOfficialExport() {
  const settings = await loadSystemSettings();

  return {
    companyProfile: {
      logo: settings?.logo ? getAvatarUrl(settings.logo) : null,
      companyName: settings?.name ?? "FORM'SSI",
      companyAddress: settings?.address ?? '',
      companyPostalCode: settings?.companyPostalCode ?? '',
      companyCity: settings?.companyCity ?? '',
      siret: settings?.siret ?? '',
      directorFullName: settings?.directorFullName ?? '',
    },
    tenant: { name: settings?.name ?? "FORM'SSI" },
  };
}
