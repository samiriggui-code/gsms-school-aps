import { z } from 'zod';
import {
  rhContactFields,
  zContractType,
  zUserCategory,
  zUserStatusEdit,
  zWorkTimeType,
} from '@/lib/rh-form-schema-shared';

export const FormateurEditSchema = z
  .object({
    firstName: z
      .string()
      .nonempty({ message: 'Le prénom est requis.' })
      .min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' })
      .max(50, { message: 'Le prénom ne doit pas dépasser 50 caractères.' }),
    lastName: z
      .string()
      .nonempty({ message: 'Le nom est requis.' })
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
      .max(50, { message: 'Le nom ne doit pas dépasser 50 caractères.' }),
    email: z.string().email({
      message: 'Veuillez entrer une adresse email valide.',
    }),
    ...rhContactFields,
    roleId: z.string().nonempty({
      message: 'Le rôle est requis.',
    }),
    userCategory: zUserCategory,
    specialties: z.array(z.string()).optional(),
    jobFunction: z.string().optional(),
    jobPositionId: z.string().optional().nullable(),
    qualification: z.string().optional(),
    status: zUserStatusEdit,
    birthDate: z.string().optional().nullable(),
    birthPlace: z.string().optional().nullable(),
    nationality: z.string().optional().nullable(),
    socialSecurityNumber: z.string().optional().nullable(),
    cniNumber: z.string().optional().nullable(),
    residencePermitNumber: z.string().optional().nullable(),
    residencePermitExpiry: z.string().optional().nullable(),
    contractType: zContractType,
    workTimeType: zWorkTimeType,
    contractStartDate: z.string().optional().nullable(),
    contractEndDate: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    carteProNumber: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val?.trim() || val.trim().length <= 160, {
        message: 'Référence trop longue.',
      }),
    carteProExpiry: z.string().optional().nullable(),
    isSchedulable: z.boolean(),
    avatarFile: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine((file) => !file || file.size <= 1024 * 1024, {
        message: "L'image doit faire moins de 1Mo",
      })
      .refine(
        (file) =>
          !file || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
        { message: 'Seuls les formats JPG, PNG ou GIF sont autorisés' },
      ),
    avatarAction: z.string().optional(),
    documentCni: z.any().optional(),
    documentAssurance: z.any().optional(),
    documentResidencePermit: z.any().optional(),
    documentCartePro: z.any().optional(),
  })
  .refine(
    (data) =>
      !(
        data.userCategory === 'SUBCONTRACTOR' &&
        !String(data.subcontractorId || '').trim()
      ),
    {
      message:
        'Le partenaire / organisme est obligatoire pour un intervenant hors salariat CFA.',
      path: ['subcontractorId'],
    },
  );

export type FormateurEditSchemaType = z.infer<typeof FormateurEditSchema>;
