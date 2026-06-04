import { z } from 'zod';

export const TeamSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  description: z.string().max(200).optional(),
  memberIds: z.array(z.string()),
  siteId: z.string(),
  orgUnitId: z.string(),
  leaderId: z.string().nullable(),
  type: z.string().min(1, "Le type d'équipe est requis"),
  sector: z.string().min(1, "Le secteur est requis"),
  image: z.string().nullable(),
});

export type TeamSchemaType = z.infer<typeof TeamSchema>;
