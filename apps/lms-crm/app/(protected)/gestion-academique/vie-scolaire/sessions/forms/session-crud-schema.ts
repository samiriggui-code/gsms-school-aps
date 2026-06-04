import { z } from 'zod';

export const formationSessionKindSchema = z.enum(['INITIAL', 'WITH_EXAM', 'OTHER']);

const formationSessionFieldsSchema = z.object({
  formationId: z.string().uuid(),
  dateDisplayLabel: z.string().min(1, 'Libellé dates requis.'),
  location: z.string().min(1, 'Lieu requis.'),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  registrationClosesAt: z.string().nullable().optional(),
  examDate: z.string().nullable().optional(),
  traineesMin: z.number().int().min(1).nullable().optional(),
  traineesMax: z.number().int().min(1).nullable().optional(),
  trainerUserId: z.string().uuid().nullable().optional(),
  reservedEquipmentIds: z.array(z.string().uuid()).optional(),
  venueRoomId: z.union([z.string().uuid(), z.null()]).optional(),
  sessionKind: formationSessionKindSchema.optional(),
  sessionSubtitle: z.string().nullable().optional(),
  venueBrandPrefix: z.string().nullable().optional(),
  bookingEnabled: z.boolean().optional(),
  bookingUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  participantUserIds: z.array(z.string().uuid()).optional(),
});

function refineTraineesMinMax<T extends { traineesMin?: number | null; traineesMax?: number | null }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const min = data.traineesMin;
  const max = data.traineesMax;
  if (min != null && max != null && min > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "L'effectif minimum ne peut pas dépasser l'effectif maximum.",
      path: ['traineesMax'],
    });
  }
}

export const FormationSessionCreateSchema = formationSessionFieldsSchema.superRefine(refineTraineesMinMax);

export const FormationSessionPatchSchema = formationSessionFieldsSchema
  .omit({ formationId: true })
  .partial()
  .superRefine(refineTraineesMinMax);

export type FormationSessionCreateInput = z.infer<typeof FormationSessionCreateSchema>;
export type FormationSessionPatchInput = z.infer<typeof FormationSessionPatchSchema>;
