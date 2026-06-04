import { z } from 'zod';
import { UserStatus } from '@/app/models/user';

export const ConformiteEditSchema = z.object({
  // Identity
  firstName: z.string().min(1, { message: 'Le prénom est requis.' }).min(2),
  lastName: z.string().min(1, { message: 'Le nom est requis.' }).min(2),
  email: z.string().email({ message: 'Email invalide.' }),

  // Role & Category
  roleId: z.string().min(1, { message: 'Le rôle est requis.' }),
  userCategory: z.enum(['INTERNAL', 'CLIENT', 'SUBCONTRACTOR']),

  // Professional
  jobFunction: z.string().optional(),
  qualification: z.string().optional(),

  // Status
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'BANNED', 'ABSENT']),

  // Civil & Compliance
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  nationality: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  cniNumber: z.string().optional(),
  residencePermitNumber: z.string().optional(),
  residencePermitExpiry: z.string().optional(),

  // Security & Scheduling
  carteProNumber: z.string().optional(),
  carteProExpiry: z.string().optional(),
  isSchedulable: z.boolean(),

  // Contract & Address
  contractType: z.string().optional(),
  workTimeType: z.enum(['FULL_TIME', 'PART_TIME']).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),

  // Documents & Avatar
  avatarFile: z.any().optional(),
  avatarAction: z.enum(['save', 'remove', '']).optional(),
  documentCni: z.any().optional(),
  documentAssurance: z.any().optional(),
  documentResidencePermit: z.any().optional(),
  documentCartePro: z.any().optional(),
}).refine((data) => {
  if (data.userCategory === 'SUBCONTRACTOR' && !data.roleId) {
    return false;
  }
  return true;
}, {
  message: "Le rôle est requis pour un utilisateur externe.",
  path: ["roleId"],
});

export type ConformiteEditSchemaType = z.infer<typeof ConformiteEditSchema>;
