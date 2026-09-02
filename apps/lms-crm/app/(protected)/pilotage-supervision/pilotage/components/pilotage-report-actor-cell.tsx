'use client';

import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@repo/ui/avatar';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import type { PilotageReportActor } from '@repo/api-core';

type Props = {
  actor: PilotageReportActor | null;
  at?: string | null;
  emptyLabel?: string;
};

export function PilotageReportActorCell({ actor, at, emptyLabel = '—' }: Props) {
  if (!actor) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex min-w-0 max-w-[220px] items-center gap-2">
      <Avatar className="size-9 shrink-0 border border-border/60">
        {actor.avatar ? <AvatarImage src={getAvatarUrl(actor.avatar)} alt={actor.name} /> : null}
        <AvatarFallback className="text-[10px] font-semibold">{getInitials(actor.name)}</AvatarFallback>
        <AvatarIndicator className="-end-0.5 -top-0.5">
          <AvatarStatus
            variant={actor.status === 'ACTIVE' ? 'online' : 'offline'}
            className="size-2.5"
          />
        </AvatarIndicator>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{actor.name}</p>
        {at ? (
          <p className="truncate text-[11px] text-muted-foreground">{formatDateTime(at)}</p>
        ) : (
          <p className="truncate text-[11px] text-muted-foreground">{actor.email}</p>
        )}
      </div>
    </div>
  );
}
