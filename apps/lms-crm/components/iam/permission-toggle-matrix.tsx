'use client';

import { useMemo } from 'react';
import { Badge } from '@repo/ui/badge';
import { PERMISSION_DOMAINS } from '@/lib/auth/permission-domains';
import { cn } from '@/lib/utils';

type Props = {
  assignedSlugs: string[];
  onToggle?: (slug: string) => void;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
};

/**
 * Matrice IAM — chaque permission est un badge cliquable.
 * Vert = active, rouge = inactive.
 */
export function PermissionToggleMatrix({
  assignedSlugs,
  onToggle,
  readOnly = false,
  compact = false,
  className,
}: Props) {
  const assigned = new Set(assignedSlugs);
  const interactive = !readOnly && !!onToggle;

  const allPermissions = useMemo(
    () => PERMISSION_DOMAINS.flatMap((domain) => domain.permissions),
    [],
  );

  const renderBadge = (slug: string, label: string) => {
    const active = assigned.has(slug);
    return (
      <button
        key={slug}
        type="button"
        disabled={!interactive}
        onClick={() => onToggle?.(slug)}
        title={`${label} (${slug})`}
        className={cn(
          'rounded-md transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          interactive && 'cursor-pointer hover:opacity-90',
          !interactive && 'cursor-default',
        )}
      >
        <Badge
          variant={active ? 'success' : 'destructive'}
          appearance={active ? 'light' : 'light'}
          className="text-xs font-medium px-2.5 py-1"
        >
          {label}
        </Badge>
      </button>
    );
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {allPermissions.map((p) => renderBadge(p.slug, p.label))}
        {assignedSlugs
          .filter((slug) => !allPermissions.some((p) => p.slug === slug))
          .map((slug) => renderBadge(slug, slug))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {PERMISSION_DOMAINS.map((domain) => (
        <div key={domain.id} className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {domain.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {domain.permissions.map((p) => renderBadge(p.slug, p.label))}
          </div>
        </div>
      ))}

      {assignedSlugs.filter(
        (slug) =>
          !PERMISSION_DOMAINS.some((d) => d.permissions.some((p) => p.slug === slug)),
      ).length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hors catalogue
          </p>
          <div className="flex flex-wrap gap-2">
            {assignedSlugs
              .filter(
                (slug) =>
                  !PERMISSION_DOMAINS.some((d) =>
                    d.permissions.some((p) => p.slug === slug),
                  ),
              )
              .map((slug) => renderBadge(slug, slug))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
