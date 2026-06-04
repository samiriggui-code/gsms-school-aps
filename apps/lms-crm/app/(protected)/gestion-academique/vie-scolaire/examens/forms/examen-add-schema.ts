import { z } from 'zod';

export const ExamenAddSchema = z.object({
  // IdentitÃ©
  firstName: z
    .string()
    .min(1, { message: 'Le prÃ©nom est requis.' })
    .min(2, { message: 'Le prÃ©nom doit contenir au moins 2 caractÃ¨res.' }),
  lastName: z
    .string()
    .min(1, { message: 'Le nom est requis.' })
    .min(2, { message: 'Le nom doit contenir au moins 2 caractÃ¨res.' }),
  email: z.string().email({
    message: 'Veuillez entrer une adresse email personnelle valide.',
  }),
  phone: z.string().optional(),
  
  // AccÃ¨s Plateforme (GÃ©nÃ©rÃ©s)
  proEmail: z.string().optional(),
  password: z.string().min(8, { message: 'Le mot de passe doit faire 8 caractÃ¨res min.' }),
  
  // RH & MÃ©tier
  roleId: z.string().min(1, { message: 'Le rÃ´le est requis.' }),
  userCategory: z.enum(['INTERNAL', 'CLIENT', 'Examen']),
  ExamenId: z.string().optional(), // Entreprise sous-traitante affiliÃ©e
  jobFunction: z.string().optional(),
  qualification: z.string().optional(),
  
  // Ã‰tat Civil & ConformitÃ© Security
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  cniNumber: z.string().optional(),
  residencePermitNumber: z.string().optional(),
  residencePermitExpiry: z.string().optional(),
  
  // SÃ©curitÃ© MÃ©tier
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
  if (data.userCategory === 'Examen' && !data.ExamenId) {
    return false;
  }
  return true;
}, {
  message: "L'entreprise de sous-traitance est requise pour un Examen sous-traitant.",
  path: ["ExamenId"],
});

export type ExamenAddSchemaType = z.infer<typeof ExamenAddSchema>;


