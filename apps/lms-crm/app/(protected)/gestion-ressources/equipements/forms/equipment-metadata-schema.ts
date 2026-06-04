import { z } from 'zod';
import { PEDAGOGIC_DOMAIN_VALUES } from '@/lib/equipment-constants';

const optionalDateString = z
  .string()
  .optional()
  .or(z.literal(''));

/** Métadonnées partagées : sheet ajout catalogue, fiche unité (settings), conformité. */
export const EquipmentMetadataSchema = z.object({
  pedagogicDomain: z.enum(PEDAGOGIC_DOMAIN_VALUES).optional().or(z.literal('')),
  brand: z.string().max(120).optional().or(z.literal('')),
  model: z.string().max(120).optional().or(z.literal('')),
  storageRoom: z.string().max(120).optional().or(z.literal('')),
  supplier: z.string().max(120).optional().or(z.literal('')),
  purchaseDate: optionalDateString,
  warrantyUntil: optionalDateString,
  lastControlDate: optionalDateString,
  nextControlDate: optionalDateString,
  regulatoryRef: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  avatar: z.string().optional(),
});

export type EquipmentMetadata = z.infer<typeof EquipmentMetadataSchema>;

export const emptyEquipmentMetadata = (): EquipmentMetadata => ({
  pedagogicDomain: '',
  brand: '',
  model: '',
  storageRoom: '',
  supplier: '',
  purchaseDate: '',
  warrantyUntil: '',
  lastControlDate: '',
  nextControlDate: '',
  regulatoryRef: '',
  notes: '',
});

export function normalizeEquipmentMetadata(
  raw: unknown,
): EquipmentMetadata {
  const parsed = EquipmentMetadataSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return emptyEquipmentMetadata();
}
