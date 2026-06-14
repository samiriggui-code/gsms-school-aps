import { User, UserStatus } from '@/app/models/user';

export function isUserCurrentlyAbsent(user: Pick<User, 'status' | 'hasActiveAbsence'> | null | undefined) {
  if (!user) return false;
  return user.status === UserStatus.ABSENT || Boolean(user.hasActiveAbsence);
}

export function userAbsenceAlertPeriod(user: User | null | undefined): string | null {
  if (!user?.activeAbsence) return null;
  const { startDate, endDate } = user.activeAbsence;
  return `Du ${startDate} au ${endDate}`;
}

export function userPresenceAvatarVariant(
  user: Pick<User, 'status' | 'hasActiveAbsence'> | null | undefined,
): 'online' | 'away' | 'offline' {
  if (!user) return 'offline';
  if (isUserCurrentlyAbsent(user)) return 'away';
  if (user.status === UserStatus.ACTIVE) return 'online';
  return 'offline';
}
