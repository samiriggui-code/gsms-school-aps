import * as z from 'zod';

export const AbsenceAddSchema = z.object({
  tenantUserId: z.string().min(1, 'Le collaborateur est requis'),
  type: z.enum(['CONGE_PAYE', 'MALADIE', 'RTT', 'AUTRE']),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La date de fin doit être postérieure ou égale à la date de début",
  path: ["endDate"],
});

export type AbsenceAddSchemaType = z.infer<typeof AbsenceAddSchema>;
