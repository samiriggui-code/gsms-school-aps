import { z } from 'zod';

export const DocumentAddSchema = z.object({
  type: z.enum(['CARTE_PRO', 'CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE', 'CASIER_JUDICIAIRE', 'AUTORISATION_TRAVAIL']),
  number: z.string().min(1, { message: "Le numéro de document est requis." }),
  issueDate: z.string().min(1, { message: "La date d'émission est requise." }),
  expiryDate: z.string().min(1, { message: "La date d'expiration est requise." }),
  fileUrl: z.any().optional(),
  notes: z.string().optional(),
  userId: z.string().min(1, { message: "Le collaborateur est requis." }),
});

export type DocumentAddSchemaType = z.infer<typeof DocumentAddSchema>;
