import { z } from 'zod';

export const EquipmentEditSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  serialNumber: z.string().min(2, 'Le numéro de série est requis'),
  type: z.string().optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  assignedSiteId: z.string().nullable().optional(),
  metadata: z.any().optional(),
  avatar: z.any().optional(),
});

export type EquipmentEditSchemaType = z.infer<typeof EquipmentEditSchema>;
