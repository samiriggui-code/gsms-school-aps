'use client';

import { UserListTable as CommonUserListTable } from '@/components/tables/customer-list';

interface UserListTableProps {
  showStats?: boolean;
  allowFormSheet?: boolean;
}

// Adaptateur local au module "users".
// La source commune reste la bibliotheque pattern (Metronomic/custom).
export function UserListTable({ showStats = false, allowFormSheet = false }: UserListTableProps) {
  return (
    <CommonUserListTable
      allowFormSheet={allowFormSheet}
      showStats={showStats}
    />
  );
}

