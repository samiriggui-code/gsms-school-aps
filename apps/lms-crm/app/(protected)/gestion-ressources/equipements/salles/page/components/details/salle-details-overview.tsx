'use client';

import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Ban } from 'lucide-react';
import type { VenueRoomRow } from '../../types';
import { SalleOverviewStats } from './salle-overview-stats';

export function SalleDetailsOverview({
  room,
  onTabChange,
  quickNavTabs,
}: {
  room: VenueRoomRow;
  onTabChange: (tab: string) => void;
  quickNavTabs?: Array<{ label: string; tab: string }>;
}) {
  const isInactive = room.status === 'INACTIVE' || !room.isActive;

  return (
    <div className="space-y-5">
      {isInactive && (
        <Alert
          variant="warning"
          appearance="outline"
          className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <AlertIcon>
            <Ban className="size-4 text-warning" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">
              Salle inactive
            </AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Cette salle n&apos;est plus proposée pour de nouvelles réservations.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <SalleOverviewStats room={room} />

      {quickNavTabs?.length ? (
        <div className="flex flex-wrap gap-3">
          {quickNavTabs.map((link) => (
            <button
              key={link.tab}
              type="button"
              onClick={() => onTabChange(link.tab)}
              className="text-xs font-bold text-primary hover:underline"
            >
              {link.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
