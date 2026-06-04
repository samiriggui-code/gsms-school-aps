import { z } from 'zod';

export const InventaireAddSchema = z.object({
  label: z
    .string()
    .min(1, { message: 'Le libellé est requis.' })
    .min(2, { message: 'Le libellé doit contenir au moins 2 caractères.' }),
  serialNumber: z
    .string()
    .min(1, { message: 'Le numéro de série est requis.' })
    .min(2, { message: 'Le numéro de série doit contenir au moins 2 caractères.' }),
  type: z.string().optional(),
  unitCount: z.coerce.number().int().min(1).max(20).default(3),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE']).default('AVAILABLE'),
  assignedSiteId: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  avatar: z.any().optional(),
});

export type InventaireAddSchemaInput = z.input<typeof InventaireAddSchema>;
export type InventaireAddSchemaType = z.output<typeof InventaireAddSchema>;
