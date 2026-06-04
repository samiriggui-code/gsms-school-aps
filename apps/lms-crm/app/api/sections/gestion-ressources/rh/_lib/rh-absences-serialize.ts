import type { RhAbsence, RhAbsenceStatus, RhAbsenceType, User } from '@repo/database';

type UserPick = Pick<
  User,
  'id' | 'name' | 'firstName' | 'lastName' | 'email' | 'avatar' | 'status'
>;

export function serializeAbsenceUser(u: UserPick) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    avatar: u.avatar,
    status: u.status,
  };
}

export function serializeAbsence(
  row: RhAbsence & { user: UserPick },
) {
  const user = serializeAbsenceUser(row.user);
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as RhAbsenceType,
    status: row.status as RhAbsenceStatus,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    User: user,
    TenantUser: user,
  };
}

export async function computeAbsenceStats(prisma: {
  rhAbsence: {
    count: (args: { where?: { status?: RhAbsenceStatus } }) => Promise<number>;
  };
}) {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.rhAbsence.count({}),
    prisma.rhAbsence.count({ where: { status: 'PENDING' } }),
    prisma.rhAbsence.count({ where: { status: 'APPROVED' } }),
    prisma.rhAbsence.count({ where: { status: 'REJECTED' } }),
  ]);
  return { total, pending, approved, rejected };
}

const userInclude = {
  select: {
    id: true,
    name: true,
    firstName: true,
    lastName: true,
    email: true,
    avatar: true,
    status: true,
  },
} as const;

export { userInclude as absenceUserInclude };
