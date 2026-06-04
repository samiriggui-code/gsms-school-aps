import { z } from 'zod';

/** Aligné sur l’enum Prisma `LeadStatus`. */
export const leadStatusValues = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const;

export const leadStatusUpdateSchema = z.object({
  status: z.enum(leadStatusValues),
});

export type LeadStatusUpdateValues = z.infer<typeof leadStatusUpdateSchema>;
