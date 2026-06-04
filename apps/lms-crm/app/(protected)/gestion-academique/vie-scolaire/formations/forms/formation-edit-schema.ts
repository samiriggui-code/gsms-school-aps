import { z } from 'zod';

export const FormationEditSchema = z.object({
  firstName: z
    .string()
    .nonempty({ message: 'Le prÃ©nom est requis.' })
    .min(2, { message: 'Le prÃ©nom doit contenir au moins 2 caractÃ¨res.' })
    .max(50, { message: 'Le prÃ©nom ne doit pas dÃ©passer 50 caractÃ¨res.' }),
  lastName: z
    .string()
    .nonempty({ message: 'Le nom est requis.' })
    .min(2, { message: 'Le nom doit contenir au moins 2 caractÃ¨res.' })
    .max(50, { message: 'Le nom ne doit pas dÃ©passer 50 caractÃ¨res.' }),
  email: z.string().email({
    message: 'Veuillez entrer une adresse email valide.',
  }),
  roleId: z.string().nonempty({
    message: 'Le rÃ´le est requis.',
  }),
  userCategory: z.enum(['INTERNAL', 'CLIENT', 'Formation']),
  jobFunction: z.string().optional(),
  qualification: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BANNED', 'ABSENT']),
  // HR Information
  birthDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  socialSecurityNumber: z.string().optional().nullable(),
  cniNumber: z.string().optional().nullable(),
  residencePermitNumber: z.string().optional().nullable(),
  residencePermitExpiry: z.string().optional().nullable(),
  contractType: z.string().optional().nullable(),
  workTimeType: z.string().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  carteProNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^CAR-\d{4}-\d{2}-\d{2}-\d{4}\d{7}$/.test(val),
      { message: 'Format attendu: CAR-YYYY-MM-DD-YYYYNNNNNNN' }
    ),
  carteProExpiry: z.string().optional().nullable(),
  isSchedulable: z.boolean(),
  avatarFile: z
    .instanceof(File)
    .nullable()
    .optional()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      { message: 'L\'image doit faire moins de 1Mo' },
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      { message: 'Seuls les formats JPG, PNG ou GIF sont autorisÃ©s' },
    ),
  avatarAction: z.string().optional(),
  documentCni: z.any().optional(),
  documentAssurance: z.any().optional(),
  documentResidencePermit: z.any().optional(),
  documentCartePro: z.any().optional(),
});

export type FormationEditSchemaType = z.infer<typeof FormationEditSchema>;


