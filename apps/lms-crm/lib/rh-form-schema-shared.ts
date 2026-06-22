import { z } from 'zod';

/** Aligné sur Prisma `UserCategory`. */
export const USER_CATEGORY_VALUES = ['INTERNAL', 'CLIENT', 'SUBCONTRACTOR'] as const;
export type UserCategoryValue = (typeof USER_CATEGORY_VALUES)[number];

/** Aligné sur Prisma `ContractType`. */
export const CONTRACT_TYPE_VALUES = ['CDI', 'CDD', 'INTERIM', 'STAGE'] as const;

/** Aligné sur Prisma `WorkTimeType`. */
export const WORK_TIME_TYPE_VALUES = ['FULL_TIME', 'PART_TIME'] as const;

/** Aligné sur Prisma `SchoolInternalService`. */
export const SCHOOL_INTERNAL_SERVICE_VALUES = [
  'TRAINER_POOL',
  'PEDAGOGICAL',
  'HR_ADMIN',
  'DIRECTION',
] as const;

export const USER_STATUS_EDIT_VALUES = [
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'BANNED',
  'ABSENT',
] as const;

export const zUserCategory = z.enum(USER_CATEGORY_VALUES);
export const zContractType = z.enum(CONTRACT_TYPE_VALUES).optional().nullable();
export const zWorkTimeType = z.enum(WORK_TIME_TYPE_VALUES).optional().nullable();
export const zSchoolInternalService = z.enum(SCHOOL_INTERNAL_SERVICE_VALUES).optional();
export const zUserStatusEdit = z.enum(USER_STATUS_EDIT_VALUES);

export const rhContactFields = {
  phone: z.string().optional().nullable(),
  proEmail: z.string().optional().nullable(),
  subcontractorId: z.string().optional().nullable(),
};

/** Texte vitrine landing (#trainers) — expérience, parcours, spécialités. */
export const zLandingPresentation = z
  .string()
  .max(2000, { message: 'La présentation ne doit pas dépasser 2000 caractères.' })
  .optional()
  .nullable();

/** Normalise une valeur enum Prisma pour les defaultValues de formulaire. */
export function rhEnumFieldOrNull<T extends readonly string[]>(
  value: string | null | undefined,
  allowed: T,
): T[number] | null {
  if (!value) return null;
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : null;
}
