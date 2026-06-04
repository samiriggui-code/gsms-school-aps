import { UserStatus } from '@/app/models/user';

// Default status mapping
export const UserStatusProps: Record<UserStatus, { label: string; variant: string }> = {
  [UserStatus.ACTIVE]: {
    label: 'Active',
    variant: 'success',
  },
  [UserStatus.INACTIVE]: {
    label: 'Inactive',
    variant: 'warning',
  },
  [UserStatus.BLOCKED]: {
    label: 'Blocked',
    variant: 'destructive',
  },
  [UserStatus.PENDING]: {
    label: 'Pending',
    variant: 'warning',
  },
  [UserStatus.BANNED]: {
    label: 'Banned',
    variant: 'destructive',
  },
  [UserStatus.ABSENT]: {
    label: 'Absent',
    variant: 'mono',
  },
};

// Function to get status properties
export const getUserStatusProps = (status: UserStatus) => {
  return UserStatusProps[status] || { label: 'Unknown', variant: 'success' };
};
