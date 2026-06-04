'use client';

import { Users } from 'lucide-react';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';

export function FormationSessionTrainerSummary({
  trainerName,
  trainerEmail,
  trainerAvatar,
  layout = 'default',
}: {
  trainerName: string | null;
  trainerEmail: string | null;
  trainerAvatar: string | null;
  /** `moyens` : texte à gauche, avatar carré mis en avant à droite (fiche consultation). */
  layout?: 'default' | 'moyens';
}) {
  if (!trainerName && !trainerEmail) {
    return (
      <div className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/50">
          <Users className="size-6 opacity-50" aria-hidden />
        </div>
        <p>Aucun formateur référent assigné à cette session.</p>
      </div>
    );
  }

  if (layout === 'moyens') {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/25 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col justify-center space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Formateur référent
          </p>
          <p className="text-base font-semibold text-foreground">{trainerName ?? '—'}</p>
          {trainerEmail ? <p className="truncate text-sm text-muted-foreground">{trainerEmail}</p> : null}
        </div>
        <div className="flex shrink-0 items-center justify-center self-center rounded-xl border border-border/80 bg-background/90 px-5 py-4 shadow-sm sm:self-stretch sm:px-6">
          <SessionUserAvatar
            name={trainerName}
            email={trainerEmail ?? ''}
            avatar={trainerAvatar}
            sizeClassName="size-24 sm:size-28"
            square
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/25 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <SessionUserAvatar
        name={trainerName}
        email={trainerEmail ?? ''}
        avatar={trainerAvatar}
        sizeClassName="size-14 sm:size-16"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Formateur référent
        </p>
        <p className="text-base font-semibold text-foreground">{trainerName ?? '—'}</p>
        {trainerEmail ? <p className="truncate text-sm text-muted-foreground">{trainerEmail}</p> : null}
      </div>
    </div>
  );
}
