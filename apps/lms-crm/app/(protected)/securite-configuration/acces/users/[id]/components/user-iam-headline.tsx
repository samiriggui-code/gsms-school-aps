'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/helpers';
import type { User } from '@/app/models/user';
import { UserStatus } from '@/app/models/user';
import { getUserStatusProps } from '../../constants/status';

export function UserIamHeadline({
  user,
  isLoading,
}: {
  user: User | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !user) {
    return (
      <div className="flex flex-wrap justify-between gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
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
    <div className="flex flex-wrap justify-between gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="min-w-0 break-words text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">
            {user.name || user.email}
          </span>
          <Badge size="sm" variant={variant} appearance="light">
            <BadgeDot />
            {statusPros.label}
          </Badge>
          {user.role?.name ?
            <Badge variant="secondary" appearance="light" size="sm">
              {user.role.name}
            </Badge>
          : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-2sm text-muted-foreground">
          <span className="rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">
            ID
          </span>
          <span className="font-mono text-[11px] font-bold text-foreground/90">{user.id.slice(0, 8)}…</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-normal">Dernière connexion&nbsp;:</span>
          <span className="font-semibold text-foreground/80">
            {user.lastSignInAt ? formatDateTime(new Date(user.lastSignInAt)) : 'Jamais'}
          </span>
        </div>
      </div>
    </div>
  );
}
