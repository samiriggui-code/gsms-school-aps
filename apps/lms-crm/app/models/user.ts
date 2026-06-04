import { SystemSetting } from './system';

// Enums (mirror Prisma schema UserStatus; avoid $Enums when client is generated without it)
export const UserStatus = {
  INACTIVE: 'INACTIVE',
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
  BANNED: 'BANNED',
  ABSENT: 'ABSENT',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// Models
export interface User {
  id: string;
  email: string;
  password?: string | null;
  country?: string | null;
  timezone?: string | null;
  name?: string | null;
  roleId: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt?: Date | null;
  emailVerifiedAt?: Date | null;
  emailVerified?: boolean;
  isPublic?: boolean;
  isTrashed: boolean;
  avatar?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  proEmail?: string | null;
  userCategory?: 'INTERNAL' | 'CLIENT' | 'SUBCONTRACTOR' | null;
  subcontractorId?: string | null;
  jobFunction?: string | null;
  qualification?: string | null;
  birthDate?: Date | null;
  birthPlace?: string | null;
  nationality?: string | null;
  socialSecurityNumber?: string | null;
  cniNumber?: string | null;
  residencePermitNumber?: string | null;
  residencePermitExpiry?: Date | null;
  contractType?: 'CDI' | 'CDD' | 'INTERIM' | 'STAGE' | null;
  workTimeType?: 'FULL_TIME' | 'PART_TIME' | null;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  carteProNumber?: string | null;
  carteProExpiry?: Date | null;
  isSchedulable?: boolean;
  documentCni?: string | null;
  documentAssurance?: string | null;
  documentResidencePermit?: string | null;
  documentCartePro?: string | null;
  invitedByUserId?: string | null;
  isProtected: boolean;
  role: UserRole;
  sessions?: Session[];
  accounts?: Account[];
  /** Renseigné par l’API `GET /users/:id` (`_count` Prisma). */
  _count?: Record<string, number | undefined> & {
    candidatures?: number;
    formationSessionParticipants?: number;
    enrollments?: number;
    submissions?: number;
    systemLog?: number;
    attendances?: number;
  };
  /** `User.formateurProfile.specialties` agrégées (liste collaborateurs RH). */
  teachingSpecialties?: string[];
}

export interface UserRole {
  id: string;
  slug: string;
  name: string;
  targetCategory?: User['userCategory'];
  description?: string | null;
  isTrashed: boolean;
  createdByUserId?: string | null;
  createdAt: Date;
  isProtected: boolean;
  isDefault: boolean;
  createdByUser?: User | null;
  users?: User[];
  permissions?: UserRolePermission[];
  settings?: SystemSetting[];
}

export interface UserPermission {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  createdAt: Date;
  createdByUser?: User | null;
  roles?: UserRolePermission[];
}

export interface UserRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  name?: string;
  slug?: string;
  description?: string | null;
  assignedAt: Date;
  role?: UserRole;
  permission?: UserPermission;
}

export interface UserAddress {
  id: string;
  userId: string;
  addressLine: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  user?: User;
}
export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  user?: User;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user?: User;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}
