import { z } from 'zod';

export const StructureEditSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom de l'unité est requis." })
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  type: z.enum(['HEADQUARTER', 'REGION', 'AGENCY', 'DEPARTMENT', 'SECTOR', 'DEPOSIT', 'TRAINING_SCHOOL', 'OTHER'], {
    message: "Le type d'unité est requis.",
  }),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  
  // Academy/Training specific fields
  nda: z.string().optional().nullable(),
  agreementNumber: z.string().optional().nullable(),
  qualiopiStatus: z.enum(['NONE', 'PENDING', 'OBTAINED']).default('NONE'),
  siret: z.string().optional().nullable(),
  nafCode: z.string().optional().nullable(),
  capacity: z.coerce.number().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  contactEmail: z.string().email({ message: "Email invalide" }).optional().nullable().or(z.literal('')),
  contactPhone: z.string().optional().nullable(),
  website: z.string().url({ message: "URL invalide" }).optional().nullable().or(z.literal('')),
  
  // Administrative & Commercial fields
  legalStatus: z.string().optional().nullable(),
  capital: z.string().optional().nullable(),
  rcsNumber: z.string().optional().nullable(),
  tvaNumber: z.string().optional().nullable(),
  openedAt: z.string().optional().nullable(),
  trainingTeamInfo: z.any().optional().nullable(),
});

export type StructureEditSchemaType = z.infer<typeof StructureEditSchema>;
