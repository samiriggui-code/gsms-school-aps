import { z } from 'zod';
import {
  rhContactFields,
  WORK_TIME_TYPE_VALUES,
  zContractType,
  zUserCategory,
} from '@/lib/rh-form-schema-shared';

export const ConformiteAddSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: 'Le prénom est requis.' })
      .min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
    lastName: z
      .string()
      .min(1, { message: 'Le nom est requis.' })
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
    email: z.string().email({
      message: 'Veuillez entrer un email valide.',
    }),
    ...rhContactFields,
    password: z
      .string()
      .min(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' }),
    roleId: z.string().min(1, { message: 'Le rôle est requis.' }),
    userCategory: zUserCategory,
    jobFunction: z.string().optional(),
    jobPositionId: z.string().optional().nullable(),
    qualification: z.string().optional(),
    birthDate: z.string().optional(),
    birthPlace: z.string().optional(),
    nationality: z.string().default('Française'),
    socialSecurityNumber: z.string().optional(),
    cniNumber: z.string().optional(),
    residencePermitNumber: z.string().optional(),
    residencePermitExpiry: z.string().optional(),
    carteProNumber: z.string().optional(),
    carteProExpiry: z.string().optional(),
    isSchedulable: z.boolean().default(true),
    contractType: zContractType,
    workTimeType: z.enum(WORK_TIME_TYPE_VALUES).default('FULL_TIME'),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    documentCni: z.any().optional(),
    documentAssurance: z.any().optional(),
    documentResidencePermit: z.any().optional(),
    documentCartePro: z.any().optional(),
    avatar: z.any().optional(),
  })
  .refine(
    (data) => {
      if (data.userCategory === 'SUBCONTRACTOR' && !data.subcontractorId) {
        return false;
      }
      return true;
    },
    {
      message: "L'entreprise partenaire est requise pour un utilisateur externe.",
      path: ['subcontractorId'],
    },
  );

export type ConformiteAddSchemaInput = z.input<typeof ConformiteAddSchema>;
export type ConformiteAddSchemaType = z.output<typeof ConformiteAddSchema>;
