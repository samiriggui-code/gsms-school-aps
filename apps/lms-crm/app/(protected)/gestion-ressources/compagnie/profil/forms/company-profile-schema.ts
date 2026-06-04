import { z } from 'zod';

export const CompanyProfileSchema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  siret: z.string().nullish(),
  cnaps: z.string().nullish(),
  companyType: z.string().nullish(),
  industry: z.string().nullish(),
  companySize: z.string().nullish(),
  website: z.union([z.string().url("URL invalide"), z.literal('')]).nullish(),
  companyAddress: z.string().nullish(),
  companyCity: z.string().nullish(),
  companyPostalCode: z.string().nullish(),
  companyCountry: z.string().min(1, "Le pays est requis"),
  companyRegion: z.string().nullish(),
  ndaNumber: z.string().nullish(),
  ndaSpecialty: z.string().nullish(),
  /** Valeur champ HTML date `YYYY-MM-DD` */
  ndaDeclarationDate: z.string().nullish(),
  ndaRegion: z.string().nullish(),
  ndaTrainingActions: z.string().nullish(),
  qualiopiCertifications: z.string().nullish(),
  siren: z.string().nullish(),
  establishmentNic: z.string().nullish(),
  vatIntracommunityNumber: z.string().nullish(),
  eoriNumber: z.string().nullish(),
  nafApeCode: z.string().nullish(),
  naf2025Code: z.string().nullish(),
  mainActivityDescription: z.string().nullish(),
  legalFormDetailed: z.string().nullish(),
  companyCreationDate: z.string().nullish(),
  establishmentCreationDate: z.string().nullish(),
  inseeRegistrationDate: z.string().nullish(),
  rneExtractDate: z.string().nullish(),
  employeeSituationNote: z.string().nullish(),
  companySizeCategoryNote: z.string().nullish(),
  directorRole: z.string().nullish(),
  collectiveAgreementNote: z.string().nullish(),
  inpiCompanySummary: z.string().nullish(),
  shareCapitalEuros: z.string().nullish(),
  rcsRegistryCity: z.string().nullish(),
  agreementAdef: z.string().nullish(),
  agreementQualianor: z.string().nullish(),
  agreementQualiopiRef: z.string().nullish(),
  agreementSsiap: z.string().nullish(),
  directorFullName: z.string().nullish(),
  directorEmail: z.union([z.string().email("Email invalide"), z.literal('')]).nullish(),
  directorPhone: z.string().nullish(),
  logo: z.string().nullish(),
  logoFile: z
    .instanceof(File)
    .nullish()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      { message: 'L\'image doit faire moins de 1Mo' },
    )
    .refine(
      (file) =>
        !file ||
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      { message: 'Formats acceptés : JPG, PNG, GIF ou WebP' },
    ),
  logoAction: z.string().nullish(),
  directorAvatar: z.string().nullish(),
  directorAvatarFile: z
    .instanceof(File)
    .nullish()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      { message: 'L\'image doit faire moins de 1Mo' },
    )
    .refine(
      (file) =>
        !file ||
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      { message: 'Formats acceptés : JPG, PNG, GIF ou WebP' },
    ),
  directorAvatarAction: z.string().nullish(),
  adminAvatar: z.string().nullish(),
  adminAvatarFile: z
    .instanceof(File)
    .nullish()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      { message: 'L\'image doit faire moins de 1Mo' },
    )
    .refine(
      (file) =>
        !file ||
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      { message: 'Formats acceptés : JPG, PNG, GIF ou WebP' },
    ),
  adminAvatarAction: z.string().nullish(),
});

export type CompanyProfileSchemaType = z.infer<typeof CompanyProfileSchema>;
