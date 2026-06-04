import { z } from 'zod';

/** Ligne de devis (montants HT, TVA France courante). */
export const devisLineSchema = z.object({
  label: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPriceHt: z.coerce.number().min(0),
  vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]),
});

export type DevisLineValues = z.infer<typeof devisLineSchema>;

/** Instantané entreprise / projet issu du formulaire landing devis. */
export const devisClientSnapshotSchema = z.object({
  company: z.string().optional(),
  companySiret: z.string().optional(),
  companyAddress: z.string().optional(),
  contactRole: z.string().optional(),
  traineesExpected: z.string().optional(),
  preferredDates: z.string().optional(),
  deliveryMode: z.string().optional(),
  fundingHint: z.string().optional(),
});

export type DevisClientSnapshotValues = z.infer<typeof devisClientSnapshotSchema>;

export const devisStatusValues = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const;

export const devisPatchSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(devisStatusValues).optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

export type DevisPatchValues = z.infer<typeof devisPatchSchema>;
