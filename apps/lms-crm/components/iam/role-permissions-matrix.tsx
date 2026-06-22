'use client';

import { PermissionToggleMatrix } from '@/components/iam/permission-toggle-matrix';
import { cn } from '@/lib/utils';

type PermissionRow = {
  id?: string;
  slug: string;
  name?: string;
};

type Props = {
  assignedSlugs: string[];
  className?: string;
  compact?: boolean;
  onToggle?: (slug: string) => void;
  readOnly?: boolean;
};

/** @deprecated Préférer PermissionToggleMatrix — conservé pour compatibilité. */
export function RolePermissionsMatrix({
  assignedSlugs,
  className,
  onToggle,
  readOnly = true,
}: Props) {
  return (
    <PermissionToggleMatrix
      assignedSlugs={assignedSlugs}
      onToggle={onToggle}
      readOnly={readOnly || !onToggle}
      className={cn(className)}
    />
  );
}

export function permissionSlugsFromRole(role: {
  permissions?: Array<{ slug?: string | null }> | null;
} | null): string[] {
  return (role?.permissions ?? [])
    .map((p) => p.slug)
    .filter((slug): slug is string => Boolean(slug));
}
