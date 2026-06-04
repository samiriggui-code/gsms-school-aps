import type { CompanyProfileSchemaType } from '@/app/(protected)/gestion-ressources/compagnie/profil/forms/company-profile-schema';
import type { CompanyProfileView } from '@/app/(protected)/gestion-ressources/compagnie/profil/types/company-profile-view';
import type { PrimaryAdminContactPayload } from '@/app/(protected)/gestion-ressources/compagnie/profil/types/school-stats';

export function buildCompanyProfileDefaults(
  p: CompanyProfileView,
  admin: PrimaryAdminContactPayload | null | undefined,
): CompanyProfileSchemaType {
  return {
    companyName: p.companyName || '',
    siret: p.siret || '',
    cnaps: p.cnaps || '',
    companyType: p.companyType || '',
    industry: p.industry || '',
    companySize: p.companySize || '',
    website: p.website || '',
    companyAddress: p.companyAddress || '',
    companyCity: p.companyCity || '',
    companyPostalCode: p.companyPostalCode || '',
    companyCountry: p.companyCountry || 'FR',
    companyRegion: p.companyRegion || '',
    ndaNumber: p.ndaNumber || '',
    ndaSpecialty: p.ndaSpecialty || '',
    ndaDeclarationDate: p.ndaDeclarationDate || '',
    ndaRegion: p.ndaRegion || '',
    ndaTrainingActions: p.ndaTrainingActions || '',
    qualiopiCertifications: p.qualiopiCertifications || '',
    siren: p.siren || '',
    establishmentNic: p.establishmentNic || '',
    vatIntracommunityNumber: p.vatIntracommunityNumber || '',
    eoriNumber: p.eoriNumber || '',
    nafApeCode: p.nafApeCode || '',
    naf2025Code: p.naf2025Code || '',
    mainActivityDescription: p.mainActivityDescription || '',
    legalFormDetailed: p.legalFormDetailed || '',
    companyCreationDate: p.companyCreationDate || '',
    establishmentCreationDate: p.establishmentCreationDate || '',
    inseeRegistrationDate: p.inseeRegistrationDate || '',
    rneExtractDate: p.rneExtractDate || '',
    employeeSituationNote: p.employeeSituationNote || '',
    companySizeCategoryNote: p.companySizeCategoryNote || '',
    directorRole: p.directorRole || '',
    collectiveAgreementNote: p.collectiveAgreementNote || '',
    inpiCompanySummary: p.inpiCompanySummary || '',
    shareCapitalEuros: p.shareCapitalEuros || '',
    rcsRegistryCity: p.rcsRegistryCity || '',
    agreementAdef: p.agreementAdef || '',
    agreementQualianor: p.agreementQualianor || '',
    agreementQualiopiRef: p.agreementQualiopiRef || '',
    agreementSsiap: p.agreementSsiap || '',
    directorFullName: p.directorFullName || '',
    directorEmail: p.directorEmail || '',
    directorPhone: p.directorPhone || '',
    logo: p.logo || '',
    logoFile: null,
    logoAction: '',
    directorAvatar: p.directorAvatar || '',
    directorAvatarFile: null,
    directorAvatarAction: '',
    adminAvatar: admin?.avatar || '',
    adminAvatarFile: null,
    adminAvatarAction: '',
  };
}

export async function saveCompanyProfilePayload(
  payload: CompanyProfileSchemaType,
  files?: {
    logoFile?: File | null;
    directorAvatarFile?: File | null;
    adminAvatarFile?: File | null;
  },
) {
  const hasFiles =
    (files?.logoFile && files.logoFile.size > 0) ||
    (files?.directorAvatarFile && files.directorAvatarFile.size > 0) ||
    (files?.adminAvatarFile && files.adminAvatarFile.size > 0);

  if (hasFiles) {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (files?.logoFile && files.logoFile.size > 0) {
      formData.append('logoFile', files.logoFile);
    }
    if (files?.directorAvatarFile && files.directorAvatarFile.size > 0) {
      formData.append('directorAvatarFile', files.directorAvatarFile);
    }
    if (files?.adminAvatarFile && files.adminAvatarFile.size > 0) {
      formData.append('adminAvatarFile', files.adminAvatarFile);
    }
    return formData;
  }

  return JSON.stringify(payload);
}
