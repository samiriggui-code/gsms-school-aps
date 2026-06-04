import type { CompanyProfileSchemaType } from '../forms/company-profile-schema';

/** Données affichées (GET `/tenant/profile` → `data.companyProfile`). */
export type CompanyProfileView = Partial<
  Omit<
    CompanyProfileSchemaType,
    'logoFile' | 'logoAction' | 'directorAvatarFile' | 'directorAvatarAction' | 'adminAvatarFile' | 'adminAvatarAction'
  >
> & {
  logo?: string | null;
};
