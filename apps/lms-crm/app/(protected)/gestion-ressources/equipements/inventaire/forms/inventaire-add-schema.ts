import { z } from 'zod';
import { EQUIPMENT_TYPE_VALUES } from '@/lib/equipment-constants';
import { EquipmentMetadataSchema } from '../../forms/equipment-metadata-schema';

export const InventaireAddSchema = z.object({
  label: z
    .string()
    .min(1, { message: 'Le libellé est requis.' })
    .min(2, { message: 'Le libellé doit contenir au moins 2 caractères.' }),
  serialNumber: z
    .string()
    .min(1, { message: 'La référence catégorie est requise.' })
    .min(2, { message: 'La référence doit contenir au moins 2 caractères.' }),
  type: z.enum(EQUIPMENT_TYPE_VALUES).default('AUTRE'),
  unitCount: z.coerce.number().int().min(1).max(20).default(3),
  assignedSiteId: z
    .string()
    .optional()
    .transform((v) => (!v || v === 'none' || v === 'null' ? undefined : v)),
  metadata: EquipmentMetadataSchema.optional(),
  avatar: z.any().optional(),
});

export type InventaireAddSchemaInput = z.input<typeof InventaireAddSchema>;
export type InventaireAddSchemaType = z.output<typeof InventaireAddSchema>;
