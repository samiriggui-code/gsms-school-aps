import type { PrismaClient, RhAbsenceStatus, UserStatus } from '@repo/database';

const CAN_MARK_ABSENT: ReadonlySet<UserStatus> = new Set(['ACTIVE', 'PENDING']);

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normalizeDateOnly(value: Date): Date {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Nombre de jours calendaires inclusifs entre deux dates (champs `@db.Date`). */
export function computeAbsenceDuration(startDate: Date, endDate: Date): number {
  const start = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** Absence approuvée dont la période couvre aujourd’hui. */
export function isAbsenceActiveNow(
  status: RhAbsenceStatus | string,
  startDate: Date,
  endDate: Date,
): boolean {
  if (status !== 'APPROVED') return false;
  const today = startOfTodayUtc();
  const start = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);
  return today >= start && today <= end;
}

export type ActiveAbsenceSummary = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
};

export type UserWithActiveAbsence<T> = T & {
  activeAbsence: ActiveAbsenceSummary | null;
  hasActiveAbsence: boolean;
};

/** Enrichit des utilisateurs avec l’absence RH approuvée en cours (si présente). */
export async function attachActiveAbsencesToUsers<T extends { id: string }>(
  prisma: PrismaClient,
  users: T[],
): Promise<UserWithActiveAbsence<T>[]> {
  if (users.length === 0) return [];

  const today = startOfTodayUtc();
  const absences = await prisma.rhAbsence.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      status: 'APPROVED',
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: {
      id: true,
      userId: true,
      type: true,
      startDate: true,
      endDate: true,
    },
  });

  const byUserId = new Map(absences.map((row) => [row.userId, row]));

  return users.map((user) => {
    const row = byUserId.get(user.id);
    if (!row) {
      return { ...user, activeAbsence: null, hasActiveAbsence: false };
    }
    const startDate = row.startDate.toISOString().slice(0, 10);
    const endDate = row.endDate.toISOString().slice(0, 10);
    return {
      ...user,
      hasActiveAbsence: true,
      activeAbsence: {
        id: row.id,
        type: row.type,
        startDate,
        endDate,
        duration: computeAbsenceDuration(row.startDate, row.endDate),
      },
    };
  });
}

async function hasActiveApprovedAbsence(
  prisma: PrismaClient,
  userId: string,
  today: Date,
): Promise<boolean> {
  const row = await prisma.rhAbsence.findFirst({
    where: {
      userId,
      status: 'APPROVED',
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export type AbsenceStatusSyncResult = {
  userId: string;
  changed: boolean;
  status: UserStatus;
};

/** Aligne `User.status` avec les absences RH approuvées couvrant aujourd’hui. */
export async function syncUserAbsenceStatus(
  prisma: PrismaClient,
  userId: string,
): Promise<AbsenceStatusSyncResult> {
  const today = startOfTodayUtc();
  const user = await prisma.user.findFirst({
    where: { id: userId, isTrashed: false },
    select: { id: true, status: true },
  });
  if (!user) {
    return { userId, changed: false, status: 'INACTIVE' };
  }

  const onLeave = await hasActiveApprovedAbsence(prisma, userId, today);

  if (onLeave && CAN_MARK_ABSENT.has(user.status)) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ABSENT' },
    });
    return { userId, changed: true, status: 'ABSENT' };
  }

  if (!onLeave && user.status === 'ABSENT') {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });
    return { userId, changed: true, status: 'ACTIVE' };
  }

  return { userId, changed: false, status: user.status };
}

export type AbsenceBulkSyncResult = {
  scanned: number;
  changed: number;
  details: AbsenceStatusSyncResult[];
};

/** Parcourt les utilisateurs concernés (absence active ou statut ABSENT) et resynchronise. */
export async function syncAllUsersAbsenceStatus(
  prisma: PrismaClient,
): Promise<AbsenceBulkSyncResult> {
  const today = startOfTodayUtc();

  const [onLeaveRows, absentUsers] = await Promise.all([
    prisma.rhAbsence.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.user.findMany({
      where: { status: 'ABSENT', isTrashed: false },
      select: { id: true },
    }),
  ]);

  const userIds = Array.from(
    new Set([...onLeaveRows.map((r) => r.userId), ...absentUsers.map((u) => u.id)]),
  );

  const details: AbsenceStatusSyncResult[] = [];
  let changed = 0;

  for (const userId of userIds) {
    const result = await syncUserAbsenceStatus(prisma, userId);
    details.push(result);
    if (result.changed) changed += 1;
  }

  return { scanned: userIds.length, changed, details };
}
