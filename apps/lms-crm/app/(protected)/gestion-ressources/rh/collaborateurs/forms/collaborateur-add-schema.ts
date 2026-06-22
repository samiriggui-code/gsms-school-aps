import { z } from 'zod';
import { zSchoolInternalService } from '@/lib/rh-form-schema-shared';

export const CollaborateurAddSchema = z.object({
  // Identité
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
  
  // Accès Plateforme (Générés)
  proEmail: z.string().optional(),
  password: z.string().min(8, { message: 'Le mot de passe doit faire 8 caractères min.' }),
  
  // RH & Métier
  roleId: z.string().min(1, { message: 'Le rôle est requis.' }),
  userCategory: z.enum(['INTERNAL', 'CLIENT', 'SUBCONTRACTOR']),
  subcontractorId: z.string().optional(), // Entreprise sous-traitante affiliée
  schoolInternalService: zSchoolInternalService,
  jobFunction: z.string().optional(),
  jobPositionId: z.string().optional(),
  qualification: z.string().optional(),
  
  // État Civil & Conformité Security
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  cniNumber: z.string().optional(),
  residencePermitNumber: z.string().optional(),
  residencePermitExpiry: z.string().optional(),
  
  // Sécurité Métier
  carteProNumber: z.string().optional(),
  carteProExpiry: z.string().optional(),
  isSchedulable: z.boolean(),
  
  // Contrat
  contractType: z.string().optional(), // CDI, CDD, etc.
  workTimeType: z.string().optional(), // FULL_TIME, PART_TIME
  contractStartDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  
  // Documents (URLs, Base64 ou File)
  documentCni: z.any().optional(),
  documentAssurance: z.any().optional(),
  documentResidencePermit: z.any().optional(),
  documentCartePro: z.any().optional(),
  avatar: z.any().optional(),
}).refine((data) => {
  if (data.userCategory === 'SUBCONTRACTOR' && !data.subcontractorId) {
    return false;
  }
  return true;
}, {
  message: "L'entreprise de sous-traitance est requise pour un collaborateur sous-traitant.",
  path: ["subcontractorId"],
});

export type CollaborateurAddSchemaType = z.infer<typeof CollaborateurAddSchema>;
