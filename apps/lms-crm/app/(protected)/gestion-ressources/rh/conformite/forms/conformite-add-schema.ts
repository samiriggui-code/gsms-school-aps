import { z } from 'zod';

export const ConformiteAddSchema = z.object({
  // Identity
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
  phone: z.string().optional(),

  // Account (generated/provisional)
  proEmail: z.string().optional(),
  password: z.string().min(8, { message: 'Le mot de passe doit faire au moins 8 caractères.' }),

  // Role & Category
  roleId: z.string().min(1, { message: 'Le rôle est requis.' }),
  userCategory: z.enum(['INTERNAL', 'CLIENT', 'SUBCONTRACTOR']),
  subcontractorId: z.string().optional(),

  // Professional Profile
  jobFunction: z.string().optional(),
  qualification: z.string().optional(),

  // Civil & Compliance
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().default('Française'),
  socialSecurityNumber: z.string().optional(),
  cniNumber: z.string().optional(),
  residencePermitNumber: z.string().optional(),
  residencePermitExpiry: z.string().optional(),

  // Security & Scheduling
  carteProNumber: z.string().optional(),
  carteProExpiry: z.string().optional(),
  isSchedulable: z.boolean().default(true),

  // Contract & Address
  contractType: z.string().optional(),
  workTimeType: z.enum(['FULL_TIME', 'PART_TIME']).default('FULL_TIME'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),

  // Documents
  documentCni: z.any().optional(),
  documentAssurance: z.any().optional(),
  documentResidencePermit: z.any().optional(),
  documentCartePro: z.any().optional(),

  // Avatar
  avatar: z.any().optional(),
}).refine((data) => {
  if (data.userCategory === 'SUBCONTRACTOR' && !data.subcontractorId) {
    return false;
  }
  return true;
}, {
  message: "L'entreprise partenaire est requise pour un utilisateur externe.",
  path: ["subcontractorId"],
});

export type ConformiteAddSchemaInput = z.input<typeof ConformiteAddSchema>;
export type ConformiteAddSchemaType = z.output<typeof ConformiteAddSchema>;
