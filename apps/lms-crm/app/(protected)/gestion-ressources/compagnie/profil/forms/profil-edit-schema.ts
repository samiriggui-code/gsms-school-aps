import { z } from 'zod';

export const ProfilEditSchema = z.object({
  type: z.enum(['PRESTATAIRE', 'SUBCONTRACTOR']),
  name: z.string().min(2, "Le nom de l'entreprise est requis"),
  siret: z.string().optional().nullable(),
  email: z.string().email("Email invalide"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  agreementNumber: z.string().optional().nullable(),
  authorizationNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  documentInsuranceFile: z.instanceof(File).nullable().optional(),
  documentKbisFile: z.instanceof(File).nullable().optional(),
  documentAgreementFile: z.instanceof(File).nullable().optional(),
  avatarFile: z
    .instanceof(File)
    .nullable()
    .optional()
    .refine(
      (file) => !file || file.size <= 1024 * 1024,
      { message: 'L\'image doit faire moins de 1Mo' },
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/png', 'image/gif'].includes(file.type),
      { message: 'Seuls les formats JPG, PNG ou GIF sont autorisés' },
    ),
  avatarAction: z.string().optional(),
});

export type ProfilEditSchemaType = z.infer<typeof ProfilEditSchema>;
