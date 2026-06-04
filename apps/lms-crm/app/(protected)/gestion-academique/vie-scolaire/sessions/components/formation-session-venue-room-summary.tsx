'use client';

import { Building2 } from 'lucide-react';

type Props = {
  roomName: string | null;
  imageUrl?: string | null;
  /** Aligné sur `FormationSessionTrainerSummary` : texte à gauche, visuel à droite. */
  layout?: 'default' | 'moyens';
};

export function FormationSessionVenueRoomSummary({ roomName, imageUrl, layout = 'default' }: Props) {
  const name = roomName?.trim() ?? '';
  const src = imageUrl?.trim();

  if (!name) {
    return (
      <div className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted/50">
          <Building2 className="size-6 opacity-50" aria-hidden />
        </div>
        <p>Aucune salle assignée à cette session.</p>
      </div>
    );
  }

  if (layout === 'moyens') {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/25 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col justify-center space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Salle réservée
          </p>
          <p className="text-base font-semibold text-foreground">{name}</p>
        </div>
        <div className="flex shrink-0 items-center justify-center self-center rounded-xl border border-border/80 bg-background/90 px-5 py-4 shadow-sm sm:self-stretch sm:px-6">
          {src ? (
            <img
              src={src}
              alt=""
              className="size-24 max-h-28 max-w-[min(100%,theme(spacing.28))] rounded-lg object-cover sm:size-28 sm:max-h-none"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg bg-muted sm:size-28">
              <Building2 className="size-12 text-muted-foreground opacity-70" aria-hidden />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/25 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background sm:size-16">
        {src ? (
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <Building2 className="size-7 text-muted-foreground sm:size-8" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Salle réservée
        </p>
        <p className="text-base font-semibold text-foreground">{name}</p>
      </div>
    </div>
  );
}
