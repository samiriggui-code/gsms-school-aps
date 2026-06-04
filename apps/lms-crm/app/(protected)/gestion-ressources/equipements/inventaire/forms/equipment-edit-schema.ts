import { z } from 'zod';
import { EQUIPMENT_TYPE_VALUES } from '@/lib/equipment-constants';
import { EquipmentMetadataSchema } from '../../forms/equipment-metadata-schema';

export const EquipmentEditSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  serialNumber: z.string().min(2, 'Le numéro de série est requis'),
  type: z.enum(EQUIPMENT_TYPE_VALUES).or(z.string()).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  assignedSiteId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === 'null' || v === 'none' || v === '' ? null : v)),
  metadata: EquipmentMetadataSchema.optional(),
  avatar: z.any().optional(),
});

export type EquipmentEditSchemaType = z.infer<typeof EquipmentEditSchema>;
