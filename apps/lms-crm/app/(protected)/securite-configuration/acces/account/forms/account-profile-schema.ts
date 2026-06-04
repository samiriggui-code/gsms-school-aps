import { z } from 'zod';

export const AccountProfileSchema = z.object({
  name: z.string().min(1).max(100),
  avatarFile: z.any().optional().nullable(),
  avatarAction: z.enum(['save', 'remove', 'none']).default('none'),
});

export type AccountProfileSchemaType = z.infer<typeof AccountProfileSchema>;
