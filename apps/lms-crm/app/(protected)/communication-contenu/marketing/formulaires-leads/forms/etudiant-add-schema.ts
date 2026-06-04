import { z } from 'zod';

export const EtudiantAddSchema = z
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
      message: 'Veuillez entrer une adresse email personnelle valide.',
    }),
    phone: z.string().optional(),

    proEmail: z.string().optional(),
    password: z.string().min(8, { message: 'Le mot de passe doit faire 8 caractères min.' }),

    roleId: z.string().min(1, { message: 'Le rôle est requis.' }),
    userCategory: z.enum(['INTERNAL', 'CLIENT', 'SUBCONTRACTOR']),
    subcontractorId: z.string().optional(),
    jobFunction: z.string().optional(),
    qualification: z.string().optional(),

    birthDate: z.string().optional(),
    birthPlace: z.string().optional(),
    nationality: z.string().optional(),
    socialSecurityNumber: z.string().optional(),
    cniNumber: z.string().optional(),
    residencePermitNumber: z.string().optional(),
    residencePermitExpiry: z.string().optional(),

    carteProNumber: z.string().optional(),
    carteProExpiry: z.string().optional(),
    isSchedulable: z.boolean(),

    contractType: z.string().optional(),
    workTimeType: z.string().optional(),
    contractStartDate: z.string().optional(),
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
      if (data.userCategory === 'SUBCONTRACTOR' && !String(data.subcontractorId || '').trim()) {
        return false;
      }
      return true;
    },
    {
      message: "L'entreprise partenaire est requise lorsque la catégorie « partenaire » est choisie.",
      path: ['subcontractorId'],
    },
  );

export type EtudiantAddSchemaType = z.infer<typeof EtudiantAddSchema>;
