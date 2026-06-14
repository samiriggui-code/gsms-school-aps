import { z } from 'zod';

export const SalleFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  shortCode: z.string().optional().nullable(),
  capacity: z.union([z.coerce.number().min(0), z.literal(''), z.null()]).optional(),
  floorLabel: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  image: z.any().optional(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().min(0),
});

export type SalleFormValues = z.output<typeof SalleFormSchema>;
