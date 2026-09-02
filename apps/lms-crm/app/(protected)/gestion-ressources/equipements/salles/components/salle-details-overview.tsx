'use client';

import { Badge } from '@repo/ui/badge';
import { Card, CardContent } from '@repo/ui/card';
import { getSalleStatusProps } from '../constants/status';
import type { VenueRoomRow } from '../types';
import { Calendar, MapPin, Users } from 'lucide-react';

export function SalleDetailsOverview({
  room,
  onTabChange,
}: {
  room: VenueRoomRow;
  onTabChange: (tab: string) => void;
}) {
  const statusProps = getSalleStatusProps(room.status);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Statut
            </p>
            <Badge size="sm" variant={statusProps.variant} appearance="light" className="text-[10px]">
              {statusProps.label}
            </Badge>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Users className="size-3" />
              Capacité
            </p>
            <p className="text-lg font-bold">{room.capacity ?? '—'}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3" />
              Zone
            </p>
            <p className="text-sm font-semibold">{room.floorLabel || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            Sessions liées
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong className="text-foreground">{room.activeSessionsCount}</strong>{' '}
              <span className="text-muted-foreground">en cours</span>
            </span>
            <span>
              <strong className="text-foreground">{room.upcomingSessionsCount}</strong>{' '}
              <span className="text-muted-foreground">à venir</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onTabChange('sessions')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Voir le planning de la salle →
            </button>
            <button
              type="button"
              onClick={() => onTabChange('inventaire-fixe')}
              className="text-xs font-bold text-primary hover:underline"
            >
              Configurer le mobilier fixe →
            </button>
            <button
              type="button"
              onClick={() => onTabChange('parametres')}
              className="text-xs font-bold text-muted-foreground hover:text-primary hover:underline"
            >
              Modifier les paramètres →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
