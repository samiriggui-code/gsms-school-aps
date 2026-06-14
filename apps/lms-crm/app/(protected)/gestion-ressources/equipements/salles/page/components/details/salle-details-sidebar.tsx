'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/helpers';
import { Calendar, Settings, Theater } from 'lucide-react';
import { getSalleStatusProps } from '../../constants/status';
import type { VenueRoomRow } from '../../types';

export function SalleDetailsSidebar({
  room,
  onTabChange,
}: {
  room: VenueRoomRow;
  onTabChange: (tab: string) => void;
}) {
  const statusProps = getSalleStatusProps(room.status);
  const imageSrc = room.imageUrl?.trim() ? getAvatarUrl(room.imageUrl.trim()) : null;
  const initials = room.name.substring(0, 3).toUpperCase();

  return (
    <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
      <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={room.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={cn(
            'flex flex-col items-center gap-2 fallback-icon',
            imageSrc ? 'hidden' : '',
          )}
        >
          <Theater className="size-[60px] text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {initials}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Libellé', value: room.name },
          { label: 'Code court', value: room.shortCode || '—' },
          { label: 'Zone', value: room.floorLabel || '—' },
          { label: 'Capacité', value: room.capacity != null ? String(room.capacity) : '—' },
        ].map((item) => (
          <div key={item.label} className="flex justify-between items-center text-2sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-semibold text-foreground truncate max-w-[150px]">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between text-2sm">
          <span className="text-muted-foreground font-medium">Statut</span>
          <Badge
            variant={statusProps.variant}
            className="font-bold h-4.5 px-1.5 text-[10px]"
            appearance="light"
          >
            {statusProps.label}
          </Badge>
        </div>
        <div
          className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
          onClick={() => onTabChange('sessions')}
        >
          <span className="text-muted-foreground">Sessions en cours</span>
          <span className="font-semibold text-foreground">{room.activeSessionsCount}</span>
        </div>
        <div
          className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
          onClick={() => onTabChange('sessions')}
        >
          <span className="text-muted-foreground">Sessions à venir</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Calendar className="size-3.5 text-muted-foreground" />
            {room.upcomingSessionsCount}
          </span>
        </div>
        <div
          className="flex items-center justify-between text-2sm cursor-pointer hover:bg-muted/50 transition-colors p-1 -m-1 rounded"
          onClick={() => onTabChange('parametres')}
        >
          <span className="text-muted-foreground">Paramètres</span>
          <Settings className="size-3.5 text-primary" />
        </div>
      </div>
    </div>
  );
}
