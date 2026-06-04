export type AbsenceType =
  | 'CONGE_PAYE'
  | 'MALADIE'
  | 'RTT'
  | 'AUTRE';

export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AbsenceUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
  status?: string | null;
  _count?: {
    absences?: number;
    journalEntries?: number;
  };
}

export interface Absence {
  id: string;
  userId: string;
  type: AbsenceType;
  status: AbsenceStatus;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  User?: AbsenceUser | null;
  TenantUser?: AbsenceUser | null;
}
