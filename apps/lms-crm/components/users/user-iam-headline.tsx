'use client';

import { Badge, BadgeDot } from '@repo/ui/badge';
import { Skeleton } from '@repo/ui/skeleton';
import { formatDateTime } from '@/lib/helpers';
import type { User } from '@/app/models/user';
import { UserStatus } from '@/app/models/user';
import { getUserStatusProps } from '@/app/(protected)/securite-configuration/acces/users/constants/status';

/** Bandeau titre fiche compte IAM (sheet + page). */
export function UserIamHeadline({
  user,
  isLoading,
}: {
  user: User | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !user) {
    return (
      <div className="flex flex-wrap justify-between gap-2 border-b border-border px-4 py-4 sm:px-5 sm:py-5 bg-background shrink-0">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    );
  }

  const statusPros = getUserStatusProps(user.status as UserStatus);
  const variant = statusPros.variant as 'success' | 'warning' | 'destructive';

  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border bg-background px-4 py-4 sm:px-5 sm:py-5 shrink-0">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="min-w-0 break-words text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg lg:text-[24px]">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || 'Utilisateur'}
          </span>
          <Badge size="sm" variant={variant} appearance="light" className="font-bold uppercase text-[10px] px-2">
            <BadgeDot />
            {statusPros.label}
          </Badge>
          {user.role?.name ? (
            <Badge variant="secondary" appearance="light" size="sm" className="font-bold text-[10px]">
              {user.role.name}
            </Badge>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-2sm">
          <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-0.5">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
            <span className="font-bold text-foreground/80">{user.id.substring(0, 8)}</span>
          </div>
          <BadgeDot className="bg-muted-foreground/30 size-1" />
          <span className="font-normal text-muted-foreground">Dernière connexion&nbsp;:</span>
          <span className="font-semibold text-foreground/80">
            {user.lastSignInAt ? formatDateTime(new Date(user.lastSignInAt)) : 'Jamais'}
          </span>
        </div>
      </div>
    </div>
  );
}
