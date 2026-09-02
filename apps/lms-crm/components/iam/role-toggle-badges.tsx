'use client';

import { Badge } from '@repo/ui/badge';
import { cn } from '@/lib/utils';

export type RoleToggleItem = {
  id: string;
  name: string;
  slug?: string | null;
};

type Props = {
  roles: RoleToggleItem[];
  assignedRoleIds: string[];
  onToggle: (roleId: string) => void;
  readOnly?: boolean;
  className?: string;
};

/** Badges rôles cliquables — vert si la permission est assignée au rôle. */
export function RoleToggleBadges({
  roles,
  assignedRoleIds,
  onToggle,
  readOnly = false,
  className,
}: Props) {
  const assigned = new Set(assignedRoleIds);
  const interactive = !readOnly;

  if (!roles.length) {
    return (
      <p className="text-sm text-muted-foreground">Aucun rôle disponible.</p>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {roles.map((role) => {
        const active = assigned.has(role.id);
        return (
          <button
            key={role.id}
            type="button"
            disabled={!interactive}
            onClick={() => onToggle(role.id)}
            title={role.slug ? `${role.name} (${role.slug})` : role.name}
            className={cn(
              'rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              interactive && 'cursor-pointer hover:opacity-90',
              !interactive && 'cursor-default',
            )}
          >
            <Badge
              variant={active ? 'success' : 'destructive'}
              appearance="light"
              className="text-xs font-medium px-2.5 py-1"
            >
              {role.name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
